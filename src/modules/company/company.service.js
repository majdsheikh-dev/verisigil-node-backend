import { spawn } from "child_process";
import fs from "fs";
import path from "path";

import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import { getDashboardStats } from "../logos/logos.service.js";
import { normalizeAnalysisResponse } from "../../utils/analysis-mapper.js";
import { normalizeCrawlerResultResponse } from "../../utils/crawler-result-mapper.js";
import { toPublicUploadPath } from "../../utils/upload-path.js";
import { env } from "../../config/env.js";

const getUserCompanyId = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      companyId: true,
    },
  });

  return user?.companyId || null;
};

const buildCrawlerResultWhere = ({
  companyId,
  status,
  productStatus,
  sourceType,
  accountLabel,
  targetSite,
  brand,
}) => {
  const where = {
    companyId,
  };

  const normalizedStatus = productStatus || status;

  if (normalizedStatus) {
    where.productStatus = String(normalizedStatus).trim();
  }

  if (sourceType) {
    where.sourceType = String(sourceType).trim();
  }

  if (accountLabel) {
    where.accountLabel = String(accountLabel).trim();
  }

  if (targetSite) {
    where.targetSite = String(targetSite).trim();
  }

  if (brand) {
    where.brand = String(brand).trim().toLowerCase();
  }

  return where;
};

const normalizeSites = (sites) => {
  const rawSites = Array.isArray(sites) ? sites : [sites];

  const normalizedSites = rawSites
    .map((site) => String(site || "").trim().toLowerCase())
    .filter(Boolean)
    .map((site) => site.replace(/^https?:\/\//i, ""))
    .map((site) => site.replace(/^www\./i, ""))
    .map((site) => site.split("/")[0])
    .filter((site) => /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(site));

  return [...new Set(normalizedSites)];
};

const normalizeScanLimit = (limit) => {
  const parsed = Number(limit);

  if (!Number.isFinite(parsed)) {
    return 5;
  }

  return Math.min(Math.max(Math.trunc(parsed), 1), 20);
};

const getCrawlerPythonPath = () => {
  if (env.crawlerPythonPath) {
    return env.crawlerPythonPath;
  }

  if (!env.crawlerProjectRoot) {
    return "";
  }

  return path.join(env.crawlerProjectRoot, ".venv", "Scripts", "python.exe");
};

const startDetachedProcess = ({ command, args, cwd, label }) => {
  const child = spawn(command, args, {
    cwd,
    detached: false,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (data) => {
    console.log(`[${label}] ${String(data).trim()}`);
  });

  child.stderr.on("data", (data) => {
    console.error(`[${label} ERROR] ${String(data).trim()}`);
  });

  child.on("error", (error) => {
    console.error(`[${label} FAILED]`, error);
  });

  child.on("close", (code) => {
    console.log(`[${label}] exited with code ${code}`);
  });

  return child.pid;
};

export const getCompanyDashboard = async (userId) => {
  const dashboard = await getDashboardStats({ userId });
  const companyId = await getUserCompanyId(userId);

  const [referenceLogos, recentReports, totalReports] = await Promise.all([
    prisma.referenceLogo.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.violationReport.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.violationReport.count({
      where: { userId },
    }),
  ]);

  const crawlerStats = {
    totalCrawlerResults: 0,
    pendingAnalysisCount: 0,
    pendingSimilarityCount: 0,
    authenticCount: 0,
    suspiciousCount: 0,
    counterfeitCount: 0,
    noLogoDetectedCount: 0,
    fakeAccountsCount: 0,
    instagramCount: 0,
    googleImagesCount: 0,
  };

  let recentCrawlerResults = [];

  if (companyId) {
    const [
      totalCrawlerResults,
      pendingAnalysisCount,
      pendingSimilarityCount,
      authenticCount,
      suspiciousCount,
      counterfeitCount,
      noLogoDetectedCount,
      fakeAccountsCount,
      instagramCount,
      googleImagesCount,
      latestCrawlerRows,
    ] = await Promise.all([
      prisma.crawlerResult.count({
        where: { companyId },
      }),
      prisma.crawlerResult.count({
        where: { companyId, productStatus: "pending_analysis" },
      }),
      prisma.crawlerResult.count({
        where: { companyId, productStatus: "pending_similarity" },
      }),
      prisma.crawlerResult.count({
        where: { companyId, productStatus: "authentic" },
      }),
      prisma.crawlerResult.count({
        where: { companyId, productStatus: "suspicious" },
      }),
      prisma.crawlerResult.count({
        where: { companyId, productStatus: "counterfeit" },
      }),
      prisma.crawlerResult.count({
        where: { companyId, productStatus: "no_logo_detected" },
      }),
      prisma.crawlerResult.count({
        where: { companyId, accountLabel: "fake" },
      }),
      prisma.crawlerResult.count({
        where: { companyId, sourceType: "instagram" },
      }),
      prisma.crawlerResult.count({
        where: { companyId, platform: "google_images" },
      }),
      prisma.crawlerResult.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    crawlerStats.totalCrawlerResults = totalCrawlerResults;
    crawlerStats.pendingAnalysisCount = pendingAnalysisCount;
    crawlerStats.pendingSimilarityCount = pendingSimilarityCount;
    crawlerStats.authenticCount = authenticCount;
    crawlerStats.suspiciousCount = suspiciousCount;
    crawlerStats.counterfeitCount = counterfeitCount;
    crawlerStats.noLogoDetectedCount = noLogoDetectedCount;
    crawlerStats.fakeAccountsCount = fakeAccountsCount;
    crawlerStats.instagramCount = instagramCount;
    crawlerStats.googleImagesCount = googleImagesCount;
    recentCrawlerResults = latestCrawlerRows.map(normalizeCrawlerResultResponse);
  }

  return {
    stats: {
      ...dashboard.stats,
      violationReports: totalReports,
    },
    crawlerStats,
    recentAnalyses: dashboard.recentAnalyses.map(normalizeAnalysisResponse),
    recentCrawlerResults,
    referenceLogos,
    recentReports,
  };
};

export const createReferenceLogo = async ({ userId, brandName, filePath }) => {
  return prisma.referenceLogo.create({
    data: {
      userId,
      brandName,
      imagePath: toPublicUploadPath(filePath),
    },
  });
};

export const getReferenceLogos = async (userId) => {
  return prisma.referenceLogo.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

export const getCompanyCrawlerResults = async ({
  companyId,
  status,
  productStatus,
  sourceType,
  accountLabel,
  targetSite,
  brand,
  page = 1,
  limit = 10,
}) => {
  if (!companyId) {
    throw new AppError(400, "User is not linked to a company");
  }

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const skip = (safePage - 1) * safeLimit;

  const where = buildCrawlerResultWhere({
    companyId,
    status,
    productStatus,
    sourceType,
    accountLabel,
    targetSite,
    brand,
  });

  const [items, total] = await Promise.all([
    prisma.crawlerResult.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: safeLimit,
    }),
    prisma.crawlerResult.count({ where }),
  ]);

  return {
    items: items.map(normalizeCrawlerResultResponse),
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

export const getCompanyCrawlerResultById = async ({ id, companyId }) => {
  if (!companyId) {
    throw new AppError(400, "User is not linked to a company");
  }

  const item = await prisma.crawlerResult.findUnique({
    where: { id },
  });

  if (!item) {
    throw new AppError(404, "Crawler result not found");
  }

  if (item.companyId !== companyId) {
    throw new AppError(404, "Crawler result not found");
  }

  return normalizeCrawlerResultResponse(item);
};

export const startCompanyGoogleScan = async ({
  companyId,
  companyBrandSlug,
  sites,
  limit,
}) => {
  if (!companyId || !companyBrandSlug) {
    throw new AppError(400, "User is not linked to a company");
  }

  const normalizedSites = normalizeSites(sites);

  if (!normalizedSites.length) {
    throw new AppError(400, "At least one valid target site is required");
  }

  const safeLimit = normalizeScanLimit(limit);

  if (!env.crawlerProjectRoot) {
    throw new AppError(500, "CRAWLER_PROJECT_ROOT is not configured");
  }

  if (!fs.existsSync(env.crawlerProjectRoot)) {
    throw new AppError(500, "Crawler project root does not exist", {
      crawlerProjectRoot: env.crawlerProjectRoot,
    });
  }

  const pythonPath = getCrawlerPythonPath();

  if (!pythonPath || !fs.existsSync(pythonPath)) {
    throw new AppError(500, "Crawler Python executable was not found", {
      crawlerPythonPath: pythonPath,
    });
  }

  const args = [
    "-m",
    "src.google_main",
    "--brand",
    companyBrandSlug,
    "--sites",
    ...normalizedSites,
    "--limit",
    String(safeLimit),
  ];

  const pid = startDetachedProcess({
    command: pythonPath,
    args,
    cwd: env.crawlerProjectRoot,
    label: `GOOGLE_SCAN:${companyBrandSlug}`,
  });

  return {
    message: `Google targeted scan started for ${companyBrandSlug} on ${normalizedSites.join(", ")}`,
    pid,
    brand: companyBrandSlug,
    sites: normalizedSites,
    limit: safeLimit,
  };
};