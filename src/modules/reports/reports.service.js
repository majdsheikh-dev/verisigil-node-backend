import { prisma } from "../../lib/prisma.js";

export const createViolationReport = async ({
  userId,
  analysisId,
  reportType,
  description,
}) => {
  return prisma.violationReport.create({
    data: {
      userId,
      analysisId: analysisId || null,
      reportType,
      description: description || null,
    },
  });
};

export const getViolationReports = async ({ userId, page = 1, limit = 10 }) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const skip = (safePage - 1) * safeLimit;

  const where = { userId };

  const [items, total] = await Promise.all([
    prisma.violationReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: safeLimit,
    }),
    prisma.violationReport.count({ where }),
  ]);

  return {
    items,
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};