import { AppError } from "../../utils/app-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import {
  createViolationReport,
  getViolationReports,
} from "./reports.service.js";
import { reportSchema } from "./reports.schema.js";

export const createReport = asyncHandler(async (req, res) => {
  const parsed = reportSchema.safeParse(req.body);

  if (!parsed.success) {
    throw new AppError(400, "Validation failed", parsed.error.flatten());
  }

  const { analysisId, reportType, description } = parsed.data;

  const report = await createViolationReport({
    userId: req.user.id,
    analysisId,
    reportType,
    description,
  });

  res.status(201).json({ item: report });
});

export const listReports = asyncHandler(async (req, res) => {
  const result = await getViolationReports({
    userId: req.user.id,
    page: req.query.page,
    limit: req.query.limit,
  });

  res.status(200).json(result);
});