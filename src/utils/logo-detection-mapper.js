import { env } from "../config/env.js";

const toFullDetectorUrl = (value) => {
  if (!value) return null;

  if (String(value).startsWith("http://") || String(value).startsWith("https://")) {
    return value;
  }

  if (String(value).startsWith("/")) {
    return `${env.logoDetectionServiceUrl}${value}`;
  }

  return value;
};

export const normalizeLogoDetectionResponse = (detection) => ({
  id: detection.id,
  sourceImageId: detection.sourceImageId,
  sourceType: detection.sourceType,
  sourceImagePath: detection.sourceImagePath,
  previewImagePath: detection.previewImagePath,
  previewUrl: toFullDetectorUrl(detection.previewUrl),
  detected: detection.detected,
  detectionId: detection.detectionId,
  brand: detection.brand,
  logoConfidence: detection.logoConfidence,
  bbox: detection.bbox,
  bboxPadded: detection.bboxPadded,
  cropPath: detection.cropPath,
  cropUrl: toFullDetectorUrl(detection.cropUrl),
  imageWidth: detection.imageWidth,
  imageHeight: detection.imageHeight,
  analysisId: detection.analysisId,
  crawlerResultId: detection.crawlerResultId,
  createdAt: detection.createdAt,
  updatedAt: detection.updatedAt,
});

export const normalizeLogoDetectionRunResponse = (payload) => ({
  sourceImageId: payload.source_image_id || payload.sourceImageId,
  sourceType: payload.source_type || payload.sourceType,
  sourceImage: payload.source_image || payload.sourceImage,
  previewImage: payload.preview_image || payload.previewImage,
  previewUrl: toFullDetectorUrl(payload.preview_url || payload.previewUrl),
  detected: Boolean(payload.detected),
  detections: Array.isArray(payload.detections) ? payload.detections : [],
});