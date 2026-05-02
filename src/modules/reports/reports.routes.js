import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/role.middleware.js";
import { createReport, listReports } from "./reports.controller.js";

const router = Router();

router.use(authMiddleware);
router.use(requireRole("COMPANY", "ADMIN"));

router.get("/", listReports);
router.post("/report", createReport);

export default router;