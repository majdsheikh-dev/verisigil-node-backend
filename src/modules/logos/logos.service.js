import fs from "fs";
import FormData from "form-data";

import { prisma } from "../../lib/prisma.js";
import { aiClient } from "../../lib/ai-client.js";
import { AppError } from "../../utils/app-error.js";
import { mapAiResultToAnalysisData } from "../../utils/ai-result-mapper.js";
import { toPublicUploadPath } from "../../utils/upload-path.js";

export const getHistory = async ({ userId, guestToken, page = 1, limit = 10 }) => {
  if (!userId && !guestToken) {
    return {
      items: [],
      meta: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const skip = (safePage - 1) * safeLimit;

  const where = userId ? { userId } : { guestToken };

  const [items, total] = await Promise.all([
    prisma.analysis.findMany({
      where,
      orderBy: { createdAt: "desc",
      },
      skip,
      take: safeLimit,
    }),
    prisma.analysis.count({ where }),
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

export const getAnalysisById = async ({ id, userId, guestToken }) => {
  const analysis = await prisma.analysis.findUnique({
    where: { id },
  });

  if (!analysis) {
    throw new AppError(404, "Analysis not found");
  }

  const isOwner =
    (userId && analysis.userId === userId) ||
    (!userId && guestToken && analysis.guestToken === guestToken);

  if (!isOwner) {
    throw new AppError(403, "You are not allowed to access this analysis");
  }

  return analysis;
};

const callAiService = async (file) => {
  try {
    const formData = new FormData();
    formData.append("image", fs.createReadStream(file.path), file.originalname);

    const response = await aiClient.post("/ai/full-analysis", formData, {
      headers: formData.getHeaders(),
    });

    return response.data;
  } catch (error) {
    throw new AppError(
      502,
      "AI service is unavailable or returned an invalid response",
      error.response?.data || error.message
    );
  }
};

export const createAnalysis = async ({ file, userId, guestToken }) => {
  if (!file) {
    throw new AppError(400, "Image file is required");
  }

  if (!userId && !guestToken) {
    throw new AppError(400, "Guest token or authenticated user is required");
  }

  const aiResult = await callAiService(file);

  const analysisData = mapAiResultToAnalysisData(
    aiResult,
    toPublicUploadPath(file.path),
    userId,
    guestToken
  );

  return prisma.analysis.create({
    data: analysisData,
  });
};

export const getDashboardStats = async ({ userId }) => {
  const [totalAnalyses, authenticCount, suspiciousCount, counterfeitCount] =
    await Promise.all([
      prisma.analysis.count({
        where: { userId },
      }),
      prisma.analysis.count({
        where: { userId, status: "AUTHENTIC" },
      }),
      prisma.analysis.count({
        where: { userId, status: "SUSPICIOUS" },
      }),
      prisma.analysis.count({
        where: { userId, status: "COUNTERFEIT" },
      }),
    ]);

  const recentAnalyses = await prisma.analysis.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return {
    stats: {
      totalAnalyses,
      authenticCount,
      suspiciousCount,
      counterfeitCount,
    },
    recentAnalyses,
  };
};