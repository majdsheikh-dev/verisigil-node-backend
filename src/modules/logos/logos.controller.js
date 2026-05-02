import { asyncHandler } from "../../utils/async-handler.js";
import { normalizeAnalysisResponse } from "../../utils/analysis-mapper.js";
import { getHistory, getAnalysisById, createAnalysis } from "./logos.service.js";

export const checkLogo = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const guestToken = req.guestToken || null;

  const analysis = await createAnalysis({
    file: req.file,
    userId,
    guestToken,
  });

  res.status(201).json({
    item: normalizeAnalysisResponse(analysis),
  });
});

export const history = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const guestToken = req.guestToken || null;

  const result = await getHistory({
    userId,
    guestToken,
    page: req.query.page,
    limit: req.query.limit,
  });

  res.status(200).json({
    items: result.items.map(normalizeAnalysisResponse),
    meta: result.meta,
  });
});

export const details = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const guestToken = req.guestToken || null;

  const analysis = await getAnalysisById({
    id: req.params.id,
    userId,
    guestToken,
  });

  res.status(200).json({
    item: normalizeAnalysisResponse(analysis),
  });
});