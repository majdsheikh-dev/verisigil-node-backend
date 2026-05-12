import fs from "fs";
import path from "path";

import { env } from "../../config/env.js";
import { callLogoDetectionService } from "../../lib/logo-detector-client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/app-error.js";
import {
  normalizeLogoDetectionResponse,
  normalizeLogoDetectionRunResponse,
} from "../../utils/logo-detection-mapper.js";

const toPublicDetectorUrl = (value) => {
  if (!value) return null;

  if (String(value).startsWith("http://") || String(value).startsWith("https://")) {
    return value;
  }

  if (String(value).startsWith("/")) {
    return `${env.logoDetectionServiceUrl}${value}`;
  }

  return value;
};

const resolveBackendUploadPath = (publicOrLocalPath) => {
  if (!publicOrLocalPath) return null;

  const normalized = String(publicOrLocalPath).replaceAll("\\", "/");

  if (path.isAbsolute(publicOrLocalPath)) {
    return publicOrLocalPath;
  }

  const withoutLeadingSlash = normalized.startsWith("/")
    ? normalized.slice(1)
    : normalized;

  return path.join(process.cwd(), withoutLeadingSlash);
};

const resolveCrawlerImagePath = (crawlerPath) => {
  if (!crawlerPath) return null;

  if (path.isAbsolute(crawlerPath)) {
    return crawlerPath;
  }

  if (!env.crawlerProjectRoot) {
    throw new AppError(500, "CRAWLER_PROJECT_ROOT is not configured");
  }

  return path.join(env.crawlerProjectRoot, crawlerPath);
};

const saveDetections = async ({
  runPayload,
  analysisId = null,
  crawlerResultId = null,
}) => {
  const normalizedRun = normalizeLogoDetectionRunResponse(runPayload);
  const rawDetections = normalizedRun.detections;

  if (analysisId) {
    await prisma.logoDetection.deleteMany({
      where: { analysisId },
    });
  }

  if (crawlerResultId) {
    await prisma.logoDetection.deleteMany({
      where: { crawlerResultId },
    });
  }

  if (!rawDetections.length) {
    return [];
  }

  const createdRows = [];

  for (const detection of rawDetections) {
    const created = await prisma.logoDetection.create({
      data: {
        sourceImageId: normalizedRun.sourceImageId,
        sourceType: normalizedRun.sourceType,
        sourceImagePath: normalizedRun.sourceImage,
        previewImagePath: normalizedRun.previewImage,
        previewUrl: normalizedRun.previewUrl,
        detected: true,
        detectionId: detection.detection_id || detection.detectionId,
        brand: detection.brand,
        logoConfidence: detection.logo_confidence ?? detection.logoConfidence,
        bbox: detection.bbox || {},
        bboxPadded: detection.bbox_padded || detection.bboxPadded || {},
        cropPath: detection.crop_path || detection.cropPath || null,
        cropUrl: toPublicDetectorUrl(detection.crop_url || detection.cropUrl),
        imageWidth: detection.image_width ?? detection.imageWidth ?? null,
        imageHeight: detection.image_height ?? detection.imageHeight ?? null,
        analysisId,
        crawlerResultId,
      },
    });

    createdRows.push(created);
  }

  return createdRows;
};

const getStrongestDetection = (detections) => {
  if (!detections.length) return null;

  return [...detections].sort(
    (first, second) => second.logoConfidence - first.logoConfidence
  )[0];
};

export const detectLogosForAnalysis = async ({ analysisId, userId, guestToken }) => {
  const analysis = await prisma.analysis.findUnique({
    where: { id: analysisId },
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

  const imagePath = resolveBackendUploadPath(analysis.originalImagePath);

  if (!imagePath || !fs.existsSync(imagePath)) {
    throw new AppError(404, "Analysis source image was not found", {
      originalImagePath: analysis.originalImagePath,
      resolvedPath: imagePath,
    });
  }

  const runPayload = await callLogoDetectionService({
    imagePath,
    sourceImageId: analysis.id,
    sourceType: "user_upload",
  });

  const createdDetections = await saveDetections({
    runPayload,
    analysisId: analysis.id,
  });

  const normalizedDetections = createdDetections.map(normalizeLogoDetectionResponse);

  if (!runPayload.detected) {
    await prisma.analysis.update({
      where: { id: analysis.id },
      data: {
        status: "NO_LOGO_DETECTED",
        statusLabel: "No Logo Detected",
        confidence: null,
        brandName: null,
        croppedLogoPath: null,
        notes: "Logo detector did not find a supported logo.",
        aiRawResponse: {
          ...(analysis.aiRawResponse || {}),
          logoDetection: runPayload,
        },
      },
    });
  }

  return {
    ...normalizeLogoDetectionRunResponse(runPayload),
    detections: normalizedDetections,
  };
};

export const detectLogosForCrawlerResult = async ({ crawlerResultId, companyId }) => {
  if (!companyId) {
    throw new AppError(400, "User is not linked to a company");
  }

  const crawlerResult = await prisma.crawlerResult.findUnique({
    where: { id: crawlerResultId },
  });

  if (!crawlerResult) {
    throw new AppError(404, "Crawler result not found");
  }

  if (crawlerResult.companyId !== companyId) {
    throw new AppError(404, "Crawler result not found");
  }

  const imagePath = resolveCrawlerImagePath(crawlerResult.localImagePath);

  if (!imagePath || !fs.existsSync(imagePath)) {
    throw new AppError(404, "Crawler result local image was not found", {
      localImagePath: crawlerResult.localImagePath,
      resolvedPath: imagePath,
    });
  }

  const runPayload = await callLogoDetectionService({
    imagePath,
    sourceImageId: crawlerResult.id,
    sourceType: "crawler",
  });

  const createdDetections = await saveDetections({
    runPayload,
    crawlerResultId: crawlerResult.id,
  });

  const normalizedDetections = createdDetections.map(normalizeLogoDetectionResponse);
  const strongestDetection = getStrongestDetection(createdDetections);

  if (!runPayload.detected) {
    await prisma.crawlerResult.update({
      where: { id: crawlerResult.id },
      data: {
        productStatus: "no_logo_detected",
        productStatusLabel: "No Logo Detected",
        productConfidence: null,
        brandName: null,
        croppedLogoPath: null,
        aiNotes: {
          logoDetection: runPayload,
        },
      },
    });
  } else {
    await prisma.crawlerResult.update({
      where: { id: crawlerResult.id },
      data: {
        productStatus: "pending_similarity",
        productStatusLabel: "Logo Detected - Pending Similarity",
        productConfidence: strongestDetection?.logoConfidence ?? null,
        brandName: strongestDetection?.brand ?? null,
        croppedLogoPath: strongestDetection?.cropUrl ?? null,
        aiNotes: {
          logoDetection: runPayload,
          nextStep: "Send each cropped logo to Logo Similarity/Fake Detection model.",
        },
      },
    });
  }

  return {
    ...normalizeLogoDetectionRunResponse(runPayload),
    detections: normalizedDetections,
  };
};