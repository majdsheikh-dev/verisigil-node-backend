import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";

export const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    throw new AppError(401, "Missing Bearer token");
  }

  const token = authHeader.split(" ")[1];

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AppError(401, "Invalid or expired token");
  }

  // Re-read the user on every request so disabled accounts lose access immediately.
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      fullName: true,
      companyName: true,
      companyId: true,
      company: {
        select: {
          id: true,
          name: true,
          brandSlug: true,
        },
      },
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError(401, "Unauthorized");
  }

  req.user = user;
  next();
});
