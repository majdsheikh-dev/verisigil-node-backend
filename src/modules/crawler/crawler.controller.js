import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { crawlerIngestSchema } from "./crawler.schema.js";
import { ingestCrawlerResults } from "./crawler.service.js";

export const ingestCrawler = asyncHandler(async (req, res) => {
  if (!env.crawlerIngestSecret) {
    throw new AppError(500, "Crawler ingest secret is not configured");
  }

  const crawlerSecret = req.get("X-Crawler-Secret");

  if (!crawlerSecret || crawlerSecret !== env.crawlerIngestSecret) {
    throw new AppError(401, "Invalid crawler secret");
  }

  const parsed = crawlerIngestSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError(400, "Validation failed", parsed.error.flatten());
  }

  const result = await ingestCrawlerResults(parsed.data);

  res.status(200).json(result);
});