import { env } from "../config/env.js";

export const toPublicUploadPath = (filePath) => {
  if (!filePath) return null;

  const normalized = filePath.replaceAll("\\", "/");
  const uploadPrefix = `${env.uploadDir}/`;

  if (normalized.startsWith(`/${uploadPrefix}`)) {
    return normalized;
  }

  if (normalized.startsWith(uploadPrefix)) {
    return `/${normalized}`;
  }

  const marker = `/${env.uploadDir}/`;
  const index = normalized.indexOf(marker);

  if (index === -1) {
    return normalized;
  }

  return normalized.slice(index);
};
