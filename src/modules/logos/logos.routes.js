import { Router } from "express";
import { analysisUpload } from "../../lib/multer.js";
import { checkLogo, history, details } from "./logos.controller.js";
import { optionalAuthMiddleware } from "../../middlewares/optional-auth.middleware.js";

const router = Router();

router.post("/check", optionalAuthMiddleware, analysisUpload.single("image"), checkLogo);
router.get("/history", optionalAuthMiddleware, history);
router.get("/:id", optionalAuthMiddleware, details);

export default router;