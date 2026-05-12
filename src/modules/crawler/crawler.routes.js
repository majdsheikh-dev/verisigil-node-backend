import { Router } from "express";
import { ingestCrawler } from "./crawler.controller.js";

const router = Router();

router.post("/ingest", ingestCrawler);

export default router;