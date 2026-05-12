import { asyncHandler } from "../../utils/async-handler.js";
import {
  detectLogosForAnalysis,
  detectLogosForCrawlerResult,
} from "./logo-detections.service.js";

export const detectAnalysisLogo = asyncHandler(async (req, res) => {
  const result = await detectLogosForAnalysis({
    analysisId: req.params.id,
    userId: req.user?.id || null,
    guestToken: req.guestToken,
  });

  res.status(200).json(result);
});

export const detectCrawlerResultLogo = asyncHandler(async (req, res) => {
  const result = await detectLogosForCrawlerResult({
    crawlerResultId: req.params.id,
    companyId: req.user.companyId,
  });

  res.status(200).json(result);
});