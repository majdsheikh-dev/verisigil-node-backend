import { env } from "../config/env.js";

export const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isServerError = statusCode >= 500;
  const exposeDetails = env.nodeEnv !== "production" || statusCode < 500;
  const message =
    isServerError && env.nodeEnv === "production"
      ? "Internal server error"
      : err.message || "Internal server error";

  if (isServerError) {
    console.error(err);
  }

  res.status(statusCode).json({
    message,
    details: exposeDetails ? err.details || null : null,
  });
};
