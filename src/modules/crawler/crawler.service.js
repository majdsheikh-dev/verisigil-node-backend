import { prisma } from "../../lib/prisma.js";

const COMPANY_BRANDS = new Map([
  [1, "nike"],
  [2, "adidas"],
  [3, "puma"],
]);

const toStringOrNull = (value) => {
  if (value === undefined || value === null) return null;

  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

const toRequiredString = (value) => {
  const normalized = toStringOrNull(value);
  return normalized || null;
};

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toIntOrNull = (value) => {
  const parsed = toNumberOrNull(value);
  return Number.isInteger(parsed) ? parsed : null;
};

const toDateOrNull = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeBrand = (value) => toRequiredString(value)?.toLowerCase() || null;

const getInputItems = (payload) => {
  if (Array.isArray(payload)) {
    return {
      sourceHint: null,
      items: payload,
    };
  }

  return {
    sourceHint: toStringOrNull(payload.source)?.toLowerCase() || null,
    items: payload.items || [],
  };
};

const detectInputType = (item, sourceHint) => {
  if (sourceHint === "instagram") return "instagram";
  if (sourceHint === "google_images" || sourceHint === "google") return "google";

  if (item.post_url || item.username || item.profile_url || item.account_label) {
    return "instagram";
  }

  return "google";
};

const expandGoogleImages = (item) => {
  const imageUrls = Array.isArray(item.imageUrls) ? item.imageUrls : null;
  const localImagePaths = Array.isArray(item.localImagePaths)
    ? item.localImagePaths
    : null;

  if (!imageUrls && !localImagePaths) {
    return [item];
  }

  const maxLength = Math.max(imageUrls?.length || 0, localImagePaths?.length || 0);

  if (maxLength === 0) {
    return [item];
  }

  return Array.from({ length: maxLength }, (_, index) => ({
    ...item,
    imageUrl: imageUrls?.[index] || null,
    localImagePath: localImagePaths?.[index] || null,
  }));
};

const normalizeInstagramItem = (item) => {
  return {
    companyId: toIntOrNull(item.company_id ?? item.companyId),
    brand: normalizeBrand(item.brand),
    sourceType: "instagram",
    sourceName: toStringOrNull(item.username),
    sourceUrl: toRequiredString(item.post_url ?? item.sourceUrl),
    platform: "instagram",
    title: null,
    description: toStringOrNull(item.caption),
    imageUrl: toStringOrNull(item.image_url ?? item.imageUrl),
    localImagePath: toStringOrNull(item.image_path ?? item.localImagePath),
    sellerName: toStringOrNull(item.username),
    sellerProfileUrl: toStringOrNull(item.profile_url ?? item.sellerProfileUrl),
    productStatus: "pending_analysis",
    productStatusLabel: "Pending Analysis",
    productConfidence: null,
    brandName: null,
    similarityScore: null,
    croppedLogoPath: null,
    aiNotes: item.account_prediction_status
      ? { accountPredictionStatus: item.account_prediction_status }
      : null,
    accountLabel: toStringOrNull(item.account_label ?? item.accountLabel),
    fakeProbability: toNumberOrNull(item.fake_probability ?? item.fakeProbability),
    realProbability: toNumberOrNull(item.real_probability ?? item.realProbability),
    accountScorePercent: toNumberOrNull(
      item.account_score_percent ?? item.accountScorePercent
    ),
    targetSite: null,
    searchQuery: null,
    capturedAt: toDateOrNull(item.scraped_at ?? item.capturedAt),
  };
};

const normalizeGoogleItem = (item) => {
  return {
    companyId: toIntOrNull(item.company_id ?? item.companyId),
    brand: normalizeBrand(item.brand),
    sourceType:
      toStringOrNull(item.source_type ?? item.sourceType) ||
      toStringOrNull(item.platform) ||
      "google_images",
    sourceName: toStringOrNull(item.source_name ?? item.sourceName),
    sourceUrl: toRequiredString(item.source_url ?? item.sourceUrl),
    platform: toStringOrNull(item.platform) || "google_images",
    title: toStringOrNull(item.title),
    description: toStringOrNull(item.description),
    imageUrl: toStringOrNull(item.image_url ?? item.imageUrl),
    localImagePath: toStringOrNull(
      item.image_path ?? item.localImagePath ?? item.local_image_path
    ),
    sellerName: toStringOrNull(item.seller_name ?? item.sellerName),
    sellerProfileUrl: toStringOrNull(
      item.seller_profile_url ?? item.sellerProfileUrl
    ),
    productStatus: "pending_analysis",
    productStatusLabel: "Pending Analysis",
    productConfidence: null,
    brandName: null,
    similarityScore: null,
    croppedLogoPath: null,
    aiNotes: null,
    accountLabel: null,
    fakeProbability: null,
    realProbability: null,
    accountScorePercent: null,
    targetSite: toStringOrNull(item.target_site ?? item.targetSite),
    searchQuery: toStringOrNull(item.search_query ?? item.searchQuery),
    capturedAt: toDateOrNull(item.captured_at ?? item.capturedAt),
  };
};

const validateNormalizedItem = async (item) => {
  const errors = [];

  if (!item.companyId) {
    errors.push("companyId is required");
  }

  if (!item.brand) {
    errors.push("brand is required");
  }

  if (!item.sourceType) {
    errors.push("sourceType is required");
  }

  if (!item.sourceUrl) {
    errors.push("sourceUrl is required");
  }

  if (item.companyId && !COMPANY_BRANDS.has(item.companyId)) {
    errors.push(`Unsupported companyId: ${item.companyId}`);
  }

  const expectedBrand = COMPANY_BRANDS.get(item.companyId);
  if (expectedBrand && item.brand && item.brand !== expectedBrand) {
    errors.push(
      `Brand mismatch: companyId ${item.companyId} expects ${expectedBrand}, received ${item.brand}`
    );
  }

  if (errors.length > 0) {
    return errors;
  }

  const company = await prisma.company.findUnique({
    where: { id: item.companyId },
    select: {
      id: true,
      brandSlug: true,
    },
  });

  if (!company) {
    return [`Company ${item.companyId} does not exist in database`];
  }

  if (company.brandSlug !== item.brand) {
    return [
      `Database brand mismatch: companyId ${item.companyId} expects ${company.brandSlug}, received ${item.brand}`,
    ];
  }

  return [];
};

const findExistingCrawlerResult = async (item) => {
  return prisma.crawlerResult.findFirst({
    where: {
      companyId: item.companyId,
      sourceUrl: item.sourceUrl,
      imageUrl: item.imageUrl,
    },
    select: {
      id: true,
    },
  });
};

const upsertCrawlerResult = async (item) => {
  const existing = await findExistingCrawlerResult(item);

  if (existing) {
    const updated = await prisma.crawlerResult.update({
      where: { id: existing.id },
      data: item,
    });

    return {
      action: "updated",
      item: updated,
    };
  }

  const created = await prisma.crawlerResult.create({
    data: item,
  });

  return {
    action: "created",
    item: created,
  };
};

export const ingestCrawlerResults = async (payload) => {
  const { sourceHint, items } = getInputItems(payload);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];
  const savedItems = [];

  for (const [index, rawItem] of items.entries()) {
    try {
      const inputType = detectInputType(rawItem, sourceHint);
      const expandedItems =
        inputType === "google" ? expandGoogleImages(rawItem) : [rawItem];

      for (const expandedItem of expandedItems) {
        const normalized =
          inputType === "instagram"
            ? normalizeInstagramItem(expandedItem)
            : normalizeGoogleItem(expandedItem);

        const validationErrors = await validateNormalizedItem(normalized);

        if (validationErrors.length > 0) {
          skipped += 1;
          errors.push({
            index,
            errors: validationErrors,
          });
          continue;
        }

        const result = await upsertCrawlerResult(normalized);

        if (result.action === "created") {
          created += 1;
        } else {
          updated += 1;
        }

        savedItems.push(result.item);
      }
    } catch (error) {
      skipped += 1;
      errors.push({
        index,
        errors: [error.message || "Failed to ingest item"],
      });
    }
  }

  return {
    created,
    updated,
    skipped,
    errors,
    items: savedItems,
  };
};