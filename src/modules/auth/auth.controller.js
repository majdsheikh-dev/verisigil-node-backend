import { loginSchema } from "./auth.schema.js";
import { loginUser, getCurrentUser } from "./auth.service.js";
import { AppError } from "../../utils/app-error.js";
import { asyncHandler } from "../../utils/async-handler.js";

export const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError(400, "Validation failed", parsed.error.flatten());
  }

  const result = await loginUser(parsed.data);

  res.status(200).json(result);
});

export const me = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user.id);

  res.status(200).json({ user });
});

export const logout = asyncHandler(async (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
});