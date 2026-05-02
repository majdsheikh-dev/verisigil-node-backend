import { AppError } from "../utils/app-error.js";

export const notFoundMiddleware = (req, res, next) => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};