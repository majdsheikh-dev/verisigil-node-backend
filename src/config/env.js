import dotenv from "dotenv";

dotenv.config();

const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseOrigins = (value) =>
  String(value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  appName: process.env.APP_NAME || "Verisigil Node Backend",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  corsOrigins: parseOrigins(
    process.env.CORS_ORIGINS ||
      process.env.FRONTEND_URL ||
      "http://localhost:5173"
  ),
  jwtSecret: process.env.JWT_SECRET || "change-this-super-secret-key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  jwtIssuer: process.env.JWT_ISSUER || "",
  jwtAudience: process.env.JWT_AUDIENCE || "",
  databaseUrl: process.env.DATABASE_URL || "",
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://127.0.0.1:8000",
  logoDetectionServiceUrl:
    process.env.LOGO_DETECTION_SERVICE_URL || "http://127.0.0.1:8001",
  crawlerIngestSecret: process.env.CRAWLER_INGEST_SECRET || "",
  crawlerProjectRoot: process.env.CRAWLER_PROJECT_ROOT || "",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 10),
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || "100kb",
  urlencodedBodyLimit: process.env.URLENCODED_BODY_LIMIT || "100kb",
  rateLimitWindowMs: toPositiveNumber(
    process.env.RATE_LIMIT_WINDOW_MS,
    15 * 60 * 1000
  ),
  rateLimitMax: toPositiveNumber(process.env.RATE_LIMIT_MAX, 300),
  authRateLimitMax: toPositiveNumber(process.env.AUTH_RATE_LIMIT_MAX, 20),
  analysisRateLimitMax: toPositiveNumber(
    process.env.ANALYSIS_RATE_LIMIT_MAX,
    60
  ),
};
