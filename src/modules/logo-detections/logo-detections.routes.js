import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { optionalAuthMiddleware } from "../../middlewares/optional-auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import {
  detectAnalysisLogo,
  detectCrawlerResultLogo,
} from "./logo-detections.controller.js";

const router = Router();

router.post("/analysis/:id", optionalAuthMiddleware, detectAnalysisLogo);

router.post(
  "/crawler/:id",
  authMiddleware,
  requireRole("COMPANY", "ADMIN"),
  detectCrawlerResultLogo
);

export default router;