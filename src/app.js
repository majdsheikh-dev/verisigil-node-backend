import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { guestMiddleware } from "./middlewares/guest.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const allowedOrigins = new Set(env.corsOrigins);

const createLimiter = (max, message) =>
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message,
    },
  });

const apiLimiter = createLimiter(
  env.rateLimitMax,
  "Too many requests. Please try again later."
);
const authLimiter = createLimiter(
  env.authRateLimitMax,
  "Too many authentication attempts. Please wait and try again."
);
const analysisLimiter = createLimiter(
  env.analysisRateLimitMax,
  "Too many analysis requests. Please wait and try again."
);

app.disable("x-powered-by");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: env.jsonBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: env.urlencodedBodyLimit }));

app.use("/api/auth/login", authLimiter);
app.use("/api/logos/check", analysisLimiter);
app.use(apiLimiter);

app.use(
  `/${env.uploadDir}`,
  express.static(path.join(__dirname, "..", env.uploadDir))
);

app.use(guestMiddleware);
app.use("/api", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
