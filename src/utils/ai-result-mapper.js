export const mapAiResultToAnalysisData = (aiResult, imagePath, userId, guestToken) => {
  const normalizedStatus = (aiResult.status || "ERROR").toUpperCase();

  return {
    userId: userId || null,
    guestToken: userId ? null : guestToken || null,
    originalImagePath: imagePath,
    croppedLogoPath: aiResult.croppedLogoPath || null,
    status: normalizedStatus,
    statusLabel: aiResult.statusLabel || "Error",
    confidence:
      typeof aiResult.confidence === "number" ? aiResult.confidence : null,
    brandName: aiResult.brandName || null,
    similarityScore:
      typeof aiResult.similarityScore === "number"
        ? aiResult.similarityScore
        : null,
    sourceType: aiResult.sourceType || null,
    sourceUrl: aiResult.sourceUrl || null,
    notes: aiResult.notes || null,
    aiRawResponse: aiResult,
  };
};