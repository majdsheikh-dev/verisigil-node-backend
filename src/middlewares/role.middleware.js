import { AppError } from "../utils/app-error.js";

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError(401, "Authentication required");
    }

    // Route modules pass the allowed roles explicitly to keep authorization local and readable.
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(403, "You do not have permission to access this resource");
    }

    next();
  };
};
