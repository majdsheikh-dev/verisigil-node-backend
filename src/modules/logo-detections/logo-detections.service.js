import fs from "fs";
import path from "path";

import { env } from "../../config/env.js";
import { callLogoDetectionService } from "../../lib/logo-detector-client.js";
import { callLogoSimilarityService } from "../../lib/logo-similarity-client.js";
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

const mapSimilarityStatusToProductStatus = (rawStatus) => {
  const normalized = String(rawStatus || "").trim().toLowerCase();

  if (normalized === "real") return "authentic";
  if (normalized === "fake") return "counterfeit";
  if (normalized === "suspicious") return "suspicious";

  return "pending_similarity";
};

const mapProductStatusToLabel = (status) => {
  const labels = {
    authentic: "Authentic",
    suspicious: "Suspicious",
    counterfeit: "Counterfeit",
    pending_similarity: "Logo Detected - Pending Similarity",
  };

  return labels[status] || "Logo Detected - Pending Similarity";
};

const getSimilarityCropPath = (detection) => {
  if (detection.cropPath && fs.existsSync(detection.cropPath)) {
    return detection.cropPath;
  }

  return null;
};

const buildSimilarityNotes = (results) => {
  return results.map((item) => ({
    logoDetectionId: item.logoDetectionId,
    detectionId: item.detectionId,
    brand: item.brand,
    rawStatus: item.rawStatus,
    mappedStatus: item.status,
    similarityScore: item.similarityScore,
    confidence: item.confidence,
    notes: item.notes,
    clipScore: item.clipScore,
    shapeScore: item.shapeScore,
    shapeDetails: item.shapeDetails,
    matchedReferenceId: item.matchedReferenceId,
    matchedReferencePath: item.matchedReferencePath,
    topReferenceCandidates: item.topReferenceCandidates,
    thresholds: item.thresholds,
    modelVersion: item.modelVersion,
  }));
};

const aggregateSimilarityResults = (similarityRows) => {
  if (!similarityRows.length) {
    return {
      status: "pending_similarity",
      statusLabel: "Logo Detected - Pending Similarity",
      confidence: null,
      similarityScore: null,
      brandName: null,
      strongest: null,
    };
  }

  const statuses = similarityRows.map((row) => row.status);

  let status = "suspicious";

  if (statuses.includes("counterfeit")) {
    status = "counterfeit";
  } else if (statuses.every((item) => item === "authentic")) {
    status = "authentic";
  }

  const strongest = [...similarityRows].sort((first, second) => {
    const firstConfidence = first.confidence ?? first.similarityScore ?? 0;
    const secondConfidence = second.confidence ?? second.similarityScore ?? 0;
    return secondConfidence - firstConfidence;
  })[0];

  return {
    status,
    statusLabel: mapProductStatusToLabel(status),
    confidence: strongest?.confidence ?? null,
    similarityScore: strongest?.similarityScore ?? null,
    brandName: strongest?.brand ?? null,
    strongest,
  };
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

const saveSimilarityResult = async ({ logoDetection, result }) => {
  const rawStatus = result.status || result.decision || "suspicious";
  const mappedStatus = mapSimilarityStatusToProductStatus(rawStatus);

  return prisma.logoSimilarity.create({
    data: {
      logoDetectionId: logoDetection.id,
      sourceImageId: result.source_image_id || logoDetection.sourceImageId,
      detectionId: result.detection_id || logoDetection.detectionId,
      brand: result.brand || logoDetection.brand,
      rawStatus,
      status: mappedStatus,
      statusLabel: result.status_label || mapProductStatusToLabel(mappedStatus),
      decision: result.decision || null,
      isFake: typeof result.is_fake === "boolean" ? result.is_fake : null,
      similarityScore:
        typeof result.similarity_score === "number" ? result.similarity_score : null,
      clipScore: typeof result.clip_score === "number" ? result.clip_score : null,
      shapeScore: typeof result.shape_score === "number" ? result.shape_score : null,
      shapeDetails: result.shape_details || null,
      topReferenceCandidates: result.top_reference_candidates || null,
      confidence: typeof result.confidence === "number" ? result.confidence : null,
      thresholdUsed:
        typeof result.threshold_used === "number" ? result.threshold_used : null,
      thresholds: result.thresholds || null,
      matchedReferenceId: result.matched_reference_id || null,
      matchedReferencePath: result.matched_reference_path || null,
      matchedReference: result.matched_reference || null,
      logoConfidence:
        typeof result.logo_confidence === "number"
          ? result.logo_confidence
          : logoDetection.logoConfidence,
      notes: result.notes || null,
      modelVersion: result.model_version || null,
      rawResponse: result,
    },
  });
};

const runSimilarityForDetections = async (logoDetections) => {
  const results = [];
  const errors = [];

  for (const detection of logoDetections) {
    try {
      const cropPath = getSimilarityCropPath(detection);

      if (!cropPath) {
        errors.push({
          logoDetectionId: detection.id,
          detectionId: detection.detectionId,
          error: "Crop path was not found on disk",
        });
        continue;
      }

      const similarityResult = await callLogoSimilarityService({
        imagePath: cropPath,
        brand: detection.brand,
        sourceImageId: detection.sourceImageId,
        detectionId: detection.detectionId,
        logoConfidence: detection.logoConfidence,
      });

      const saved = await saveSimilarityResult({
        logoDetection: detection,
        result: similarityResult,
      });

      results.push(saved);
    } catch (error) {
      errors.push({
        logoDetectionId: detection.id,
        detectionId: detection.detectionId,
        error: error.message || "Similarity failed",
        details: error.details || null,
      });
    }
  }

  return {
    results,
    errors,
  };
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

  const similarityRun = await runSimilarityForDetections(createdDetections);
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
  } else if (similarityRun.results.length) {
    const aggregate = aggregateSimilarityResults(similarityRun.results);

    const mappedAnalysisStatus = {
      authentic: "AUTHENTIC",
      suspicious: "SUSPICIOUS",
      counterfeit: "COUNTERFEIT",
    }[aggregate.status];

    if (mappedAnalysisStatus) {
      await prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          status: mappedAnalysisStatus,
          statusLabel: aggregate.statusLabel,
          confidence: aggregate.confidence,
          brandName: aggregate.brandName,
          similarityScore: aggregate.similarityScore,
          croppedLogoPath: aggregate.strongest?.matchedReferencePath || null,
          notes: aggregate.strongest?.notes || "Logo similarity completed.",
          aiRawResponse: {
            ...(analysis.aiRawResponse || {}),
            logoDetection: runPayload,
            logoSimilarity: buildSimilarityNotes(similarityRun.results),
            logoSimilarityErrors: similarityRun.errors,
          },
        },
      });
    }
  }

  return {
    ...normalizeLogoDetectionRunResponse(runPayload),
    detections: normalizedDetections,
    similarity: {
      results: similarityRun.results,
      errors: similarityRun.errors,
    },
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
          ...(crawlerResult.aiNotes || {}),
          logoDetection: runPayload,
        },
      },
    });

    return {
      ...normalizeLogoDetectionRunResponse(runPayload),
      detections: normalizedDetections,
      similarity: {
        results: [],
        errors: [],
      },
    };
  }

  const similarityRun = await runSimilarityForDetections(createdDetections);

  if (!similarityRun.results.length) {
    await prisma.crawlerResult.update({
      where: { id: crawlerResult.id },
      data: {
        productStatus: "pending_similarity",
        productStatusLabel: "Logo Detected - Pending Similarity",
        productConfidence: strongestDetection?.logoConfidence ?? null,
        brandName: strongestDetection?.brand ?? null,
        croppedLogoPath: strongestDetection?.cropUrl ?? null,
        aiNotes: {
          ...(crawlerResult.aiNotes || {}),
          logoDetection: runPayload,
          logoSimilarityErrors: similarityRun.errors,
          nextStep: "Similarity service did not return a result. Retry comparison later.",
        },
      },
    });
  } else {
    const aggregate = aggregateSimilarityResults(similarityRun.results);

    await prisma.crawlerResult.update({
      where: { id: crawlerResult.id },
      data: {
        productStatus: aggregate.status,
        productStatusLabel: aggregate.statusLabel,
        productConfidence: aggregate.confidence,
        brandName: aggregate.brandName,
        similarityScore: aggregate.similarityScore,
        croppedLogoPath: strongestDetection?.cropUrl ?? null,
        aiNotes: {
          ...(crawlerResult.aiNotes || {}),
          logoDetection: runPayload,
          similarity: buildSimilarityNotes(similarityRun.results),
          logoSimilarityErrors: similarityRun.errors,
        },
      },
    });
  }

  return {
    ...normalizeLogoDetectionRunResponse(runPayload),
    detections: normalizedDetections,
    similarity: {
      results: similarityRun.results,
      errors: similarityRun.errors,
    },
  };
};