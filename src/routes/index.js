import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";
import logosRoutes from "../modules/logos/logos.routes.js";
import companyRoutes from "../modules/company/company.routes.js";
import reportsRoutes from "../modules/reports/reports.routes.js";
import crawlerRoutes from "../modules/crawler/crawler.routes.js";

const router = Router();

router.use("/", healthRoutes);
router.use("/auth", authRoutes);
router.use("/logos", logosRoutes);
router.use("/company", companyRoutes);
router.use("/company/violations", reportsRoutes);
router.use("/crawler", crawlerRoutes);

export default router;