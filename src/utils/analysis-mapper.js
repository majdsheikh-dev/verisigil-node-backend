export const normalizeAnalysisResponse = (analysis) => ({
  id: analysis.id,
  status: analysis.status?.toLowerCase() || "error",
  statusLabel: analysis.statusLabel || "Error",
  confidence: analysis.confidence,
  brandName: analysis.brandName,
  similarityScore: analysis.similarityScore,
  sourceType: analysis.sourceType,
  sourceUrl: analysis.sourceUrl,
  notes: analysis.notes,
  originalImagePath: analysis.originalImagePath,
  croppedLogoPath: analysis.croppedLogoPath,
  createdAt: analysis.createdAt,
});