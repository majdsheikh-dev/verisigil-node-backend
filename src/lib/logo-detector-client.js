import fs from "fs";
import path from "path";
import FormData from "form-data";
import axios from "axios";

import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

export const logoDetectorClient = axios.create({
  baseURL: env.logoDetectionServiceUrl,
  timeout: 120000,
});

export const callLogoDetectionService = async ({
  imagePath,
  sourceImageId,
  sourceType,
}) => {
  if (!fs.existsSync(imagePath)) {
    throw new AppError(404, "Source image file was not found", {
      imagePath,
    });
  }

  try {
    const formData = new FormData();
    formData.append("image", fs.createReadStream(imagePath), path.basename(imagePath));
    formData.append("source_image_id", sourceImageId);
    formData.append("source_type", sourceType);

    const response = await logoDetectorClient.post("/detect-logo", formData, {
      headers: formData.getHeaders(),
    });

    return response.data;
  } catch (error) {
    throw new AppError(
      502,
      "Logo detection service is unavailable or returned an invalid response",
      error.response?.data || error.message
    );
  }
};