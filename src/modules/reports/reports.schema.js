import { z } from "zod";

export const reportSchema = z.object({
  analysisId: z
    .string()
    .trim()
    .max(191, "analysisId is too long")
    .nullable()
    .optional(),
  reportType: z
    .string()
    .trim()
    .min(1, "reportType is required")
    .max(50, "reportType is too long")
    .transform((value) => value.toUpperCase())
    .refine((value) => /^[A-Z0-9_-]+$/.test(value), {
      message: "reportType contains invalid characters",
    }),
  description: z
    .string()
    .trim()
    .max(1000, "description must be 1000 characters or less")
    .nullable()
    .optional()
    .transform((value) => (value === "" ? null : value)),
});
