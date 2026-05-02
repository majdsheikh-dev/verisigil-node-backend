import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

const allowedImageTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
]);

const allowedImageExtensions = new Set([".png", ".jpg", ".jpeg", ".svg"]);

const ensureDir = (targetPath) => {
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
};

const createUploader = (subFolder) => {
  const uploadPath = path.join(process.cwd(), env.uploadDir, subFolder);
  ensureDir(uploadPath);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeBaseName = path
        .basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9-_]/g, "_");

      // UUIDs make uploaded filenames hard to guess and avoid collisions between equal names.
      cb(null, `${Date.now()}-${crypto.randomUUID()}-${safeBaseName}${ext}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isAllowedType = allowedImageTypes.has(file.mimetype);
    const isAllowedExtension = allowedImageExtensions.has(ext);

    if (!isAllowedType || !isAllowedExtension) {
      return cb(new AppError(400, "Only PNG, JPG, JPEG, or SVG images are allowed"));
    }

    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: env.maxFileSizeMb * 1024 * 1024,
    },
  });
};

export const analysisUpload = createUploader("analyses");
export const referenceLogoUpload = createUploader("reference-logos");
