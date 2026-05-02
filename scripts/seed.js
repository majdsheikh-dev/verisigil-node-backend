import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@verisigil.com";
  const password = "Password123";
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      fullName: "Demo Manager",
      companyName: "Verisigil Demo Company",
      role: Role.COMPANY,
      isActive: true,
    },
    create: {
      email,
      passwordHash,
      fullName: "Demo Manager",
      companyName: "Verisigil Demo Company",
      role: Role.COMPANY,
      isActive: true,
    },
  });

  console.log("Seeded user:");
  console.log({
    email: user.email,
    password,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });