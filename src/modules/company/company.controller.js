import { AppError } from "../../utils/app-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  getCompanyDashboard,
  createReferenceLogo,
  getReferenceLogos,
} from "./company.service.js";

export const dashboard = asyncHandler(async (req, res) => {
  const result = await getCompanyDashboard(req.user.id);
  res.status(200).json(result);
});

export const dashboardStats = asyncHandler(async (req, res) => {
  const result = await getCompanyDashboard(req.user.id);

  res.status(200).json({
    stats: result.stats,
    recentAnalyses: result.recentAnalyses,
    recentReports: result.recentReports,
  });
});

export const uploadReferenceLogo = asyncHandler(async (req, res) => {
  const brandName =
    typeof req.body.brandName === "string" ? req.body.brandName.trim() : "";

  if (!brandName) {
    throw new AppError(400, "brandName is required");
  }

  if (brandName.length > 120) {
    throw new AppError(400, "brandName must be 120 characters or less");
  }

  if (!req.file) {
    throw new AppError(400, "Image file is required");
  }

  const logo = await createReferenceLogo({
    userId: req.user.id,
    brandName,
    filePath: req.file.path,
  });

  res.status(201).json({ item: logo });
});

export const listReferenceLogos = asyncHandler(async (req, res) => {
  const items = await getReferenceLogos(req.user.id);
  res.status(200).json({ items });
});
