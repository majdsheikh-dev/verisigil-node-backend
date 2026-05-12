import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { signAccessToken } from "../../utils/jwt.js";

const userInclude = {
  company: {
    select: {
      id: true,
      name: true,
      brandSlug: true,
    },
  },
};

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  companyName: user.companyName,
  companyId: user.companyId ?? null,
  company: user.company ?? null,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: userInclude,
  });

  if (!user || !user.isActive) {
    throw new AppError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError(401, "Invalid email or password");
  }

  const token = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: sanitizeUser(user),
  };
};

export const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: userInclude,
  });

  if (!user || !user.isActive) {
    throw new AppError(404, "User not found");
  }

  return sanitizeUser(user);
};