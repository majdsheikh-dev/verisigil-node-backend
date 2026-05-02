import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { referenceLogoUpload } from "../../lib/multer.js";
import {
  dashboard,
  dashboardStats,
  uploadReferenceLogo,
  listReferenceLogos,
} from "./company.controller.js";
import { profile } from "./profile.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(requireRole("COMPANY", "ADMIN"));

router.get("/profile", profile);
router.get("/dashboard", dashboard);
router.get("/dashboard/stats", dashboardStats);
router.get("/logos", listReferenceLogos);
router.post(
  "/logos/upload",
  referenceLogoUpload.single("image"),
  uploadReferenceLogo
);

export default router;