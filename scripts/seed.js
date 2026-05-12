import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const PASSWORD = "Password123";

const companies = [
  { id: 1, name: "Nike", brandSlug: "nike" },
  { id: 2, name: "Adidas", brandSlug: "adidas" },
  { id: 3, name: "Puma", brandSlug: "puma" },
];

const users = [
  {
    email: "demo@verisigil.com",
    fullName: "Demo Manager",
    companyName: "Nike",
    companyId: 1,
  },
  {
    email: "nike@verisigil.com",
    fullName: "Nike Manager",
    companyName: "Nike",
    companyId: 1,
  },
  {
    email: "adidas@verisigil.com",
    fullName: "Adidas Manager",
    companyName: "Adidas",
    companyId: 2,
  },
  {
    email: "puma@verisigil.com",
    fullName: "Puma Manager",
    companyName: "Puma",
    companyId: 3,
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  for (const company of companies) {
    await prisma.company.upsert({
      where: { id: company.id },
      update: {
        name: company.name,
        brandSlug: company.brandSlug,
      },
      create: company,
    });
  }

  const seededUsers = [];

  for (const user of users) {
    const seededUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        passwordHash,
        fullName: user.fullName,
        companyName: user.companyName,
        companyId: user.companyId,
        role: Role.COMPANY,
        isActive: true,
      },
      create: {
        email: user.email,
        passwordHash,
        fullName: user.fullName,
        companyName: user.companyName,
        companyId: user.companyId,
        role: Role.COMPANY,
        isActive: true,
      },
    });

    seededUsers.push(seededUser.email);
  }

  console.log("Seeded companies:");
  console.log(companies);

  console.log("Seeded users:");
  console.log(
    seededUsers.map((email) => ({
      email,
      password: PASSWORD,
    }))
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });