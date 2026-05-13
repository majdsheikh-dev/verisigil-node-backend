import { AppError } from "../../utils/app-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  getCompanyDashboard,
  createReferenceLogo,
  getReferenceLogos,
  getCompanyCrawlerResults,
  getCompanyCrawlerResultById,
  startCompanyGoogleScan,
} from "./company.service.js";

export const dashboard = asyncHandler(async (req, res) => {
  const result = await getCompanyDashboard(req.user.id);
  res.status(200).json(result);
});

export const dashboardStats = asyncHandler(async (req, res) => {
  const result = await getCompanyDashboard(req.user.id);

  res.status(200).json({
    stats: result.stats,
    crawlerStats: result.crawlerStats,
    recentAnalyses: result.recentAnalyses,
    recentCrawlerResults: result.recentCrawlerResults,
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

export const listCrawlerResults = asyncHandler(async (req, res) => {
  const result = await getCompanyCrawlerResults({
    companyId: req.user.companyId,
    status: req.query.status,
    productStatus: req.query.productStatus,
    sourceType: req.query.sourceType,
    accountLabel: req.query.accountLabel,
    targetSite: req.query.targetSite,
    brand: req.query.brand,
    page: req.query.page,
    limit: req.query.limit,
  });

  res.status(200).json(result);
});

export const crawlerResultDetails = asyncHandler(async (req, res) => {
  const item = await getCompanyCrawlerResultById({
    id: req.params.id,
    companyId: req.user.companyId,
  });

  res.status(200).json({ item });
});

export const startGoogleScan = asyncHandler(async (req, res) => {
  const result = await startCompanyGoogleScan({
    companyId: req.user.companyId,
    companyBrandSlug: req.user.company?.brandSlug,
    sites: req.body.sites || req.body.site,
    limit: req.body.limit,
  });

  res.status(202).json(result);
});