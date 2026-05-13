import fs from "fs";
import path from "path";
import FormData from "form-data";
import axios from "axios";

import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

export const logoSimilarityClient = axios.create({
  baseURL: env.logoSimilarityServiceUrl,
  timeout: env.logoSimilarityTimeoutMs,
});

export const callLogoSimilarityService = async ({
  imagePath,
  brand,
  sourceImageId,
  detectionId,
  logoConfidence,
}) => {
  if (!fs.existsSync(imagePath)) {
    throw new AppError(404, "Cropped logo file was not found", {
      imagePath,
    });
  }

  try {
    const formData = new FormData();
    formData.append("image", fs.createReadStream(imagePath), path.basename(imagePath));
    formData.append("brand", brand);
    formData.append("source_image_id", sourceImageId);
    formData.append("detection_id", detectionId);

    if (logoConfidence !== undefined && logoConfidence !== null) {
      formData.append("logo_confidence", String(logoConfidence));
    }

    const response = await logoSimilarityClient.post("/compare-logo", formData, {
      headers: formData.getHeaders(),
    });

    return response.data;
  } catch (error) {
    throw new AppError(
      502,
      "Logo similarity service is unavailable or returned an invalid response",
      error.response?.data || error.message
    );
  }
};