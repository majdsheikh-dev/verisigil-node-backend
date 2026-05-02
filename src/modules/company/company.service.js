import { prisma } from "../../lib/prisma.js";
import { getDashboardStats } from "../logos/logos.service.js";
import { normalizeAnalysisResponse } from "../../utils/analysis-mapper.js";
import { toPublicUploadPath } from "../../utils/upload-path.js";

export const getCompanyDashboard = async (userId) => {
  const dashboard = await getDashboardStats({ userId });

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

  return {
    stats: {
      ...dashboard.stats,
      violationReports: totalReports,
    },
    recentAnalyses: dashboard.recentAnalyses.map(normalizeAnalysisResponse),
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
