import {
  computePriceBreakdown,
  getFarmerShare,
  getPriceAtStage,
  getPriceTrend,
  stages,
} from "./supplyChain";

const STAGE_ALIASES = {
  created: "Farmer",
  farmer: "Farmer",
  farm: "Farmer",
  processing: "Processing",
  processor: "Processing",
  distributor: "Distributor",
  distribution: "Distributor",
  retailer: "Retail",
  retail: "Retail",
  consumer: "Consumer",
  completed: "Consumer",
  delivered: "Consumer",
};

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (value !== undefined && value !== null && typeof value !== "string") {
      return value;
    }
  }

  return undefined;
}

function toFiniteNumber(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function firstNumber(...values) {
  for (const value of values) {
    const parsedValue = toFiniteNumber(value);
    if (parsedValue !== undefined) {
      return parsedValue;
    }
  }

  return undefined;
}

function normalizeStage(rawStage) {
  const fallbackStage = "Farmer";
  const stageKey = String(rawStage || "").trim().toLowerCase();
  return STAGE_ALIASES[stageKey] || rawStage || fallbackStage;
}

function getStageIndex(rawLot = {}, stage) {
  const explicitIndex = firstNumber(
    rawLot?.currentStageIndex,
    rawLot?.stageIndex,
    rawLot?.lifecycle?.currentStageIndex
  );

  if (explicitIndex !== undefined) {
    return Math.max(0, Math.min(Math.round(explicitIndex), stages.length - 1));
  }

  const normalizedStage = normalizeStage(stage);
  const mappedIndex = stages.indexOf(normalizedStage);
  return mappedIndex >= 0 ? mappedIndex : 0;
}

function normalizePriceJourney(rawLot = {}, farmerPrice) {
  const rawJourney = Array.isArray(rawLot?.priceJourney)
    ? rawLot.priceJourney
    : Array.isArray(rawLot?.pricing?.journey)
      ? rawLot.pricing.journey
      : Array.isArray(rawLot?.lifecycle?.priceJourney)
        ? rawLot.lifecycle.priceJourney
        : null;

  if (rawJourney?.length) {
    return rawJourney.map((step, index) => ({
      stage: normalizeStage(
        firstNonEmpty(step?.stage, step?.name, step?.label, stages[index]) || stages[index]
      ),
      price: firstNumber(step?.price, step?.amount, step?.value) ?? 0,
    }));
  }

  return getPriceTrend(farmerPrice ?? 0);
}

export function normalizeLotData(rawLot = {}) {
  const id = String(
    firstNonEmpty(rawLot?.id, rawLot?._id, rawLot?.lotId, rawLot?.batchId, rawLot?.uuid) ||
      `lot-${Math.random().toString(36).slice(2, 10)}`
  );

  const name =
    firstNonEmpty(
      rawLot?.name,
      rawLot?.productName,
      rawLot?.cropName,
      rawLot?.title,
      rawLot?.snapshot?.name,
      rawLot?.batch?.name
    ) || "Unknown Product";

  const quantity =
    firstNumber(
      rawLot?.quantity,
      rawLot?.qty,
      rawLot?.stock,
      rawLot?.inventory,
      rawLot?.snapshot?.quantity,
      rawLot?.batch?.quantity
    ) ?? 0;

  const stage = normalizeStage(
    firstNonEmpty(
      rawLot?.stage,
      rawLot?.status,
      rawLot?.currentStage,
      rawLot?.lifecycle?.stage,
      rawLot?.snapshot?.status,
      rawLot?.batch?.stage,
      rawLot?.batch?.status
    )
  );

  const currentStageIndex = getStageIndex(rawLot, stage);

  const farmerPrice =
    firstNumber(
      rawLot?.farmerPrice,
      rawLot?.pricing?.farmer,
      rawLot?.basePrice,
      rawLot?.priceBreakdown?.farmer,
      currentStageIndex === 0 ? rawLot?.currentPrice : undefined,
      rawLot?.price
    ) ?? 0;

  const computedBreakdown = computePriceBreakdown(farmerPrice);
  const priceJourney = normalizePriceJourney(rawLot, farmerPrice);
  const derivedCurrentPrice = getPriceAtStage(farmerPrice, currentStageIndex);
  const currentPrice =
    firstNumber(
      rawLot?.currentPrice,
      rawLot?.pricing?.current,
      rawLot?.retailPrice,
      rawLot?.priceJourney?.[currentStageIndex]?.price,
      rawLot?.pricing?.journey?.[currentStageIndex]?.price,
      currentStageIndex > 0 ? rawLot?.price : undefined,
      derivedCurrentPrice
    ) ?? 0;

  const finalPrice =
    firstNumber(
      rawLot?.finalPrice,
      rawLot?.pricing?.consumer,
      rawLot?.consumerPrice,
      priceJourney?.[priceJourney.length - 1]?.price,
      computedBreakdown?.consumer
    ) ?? currentPrice;

  const farmerShareInfo =
    rawLot?.farmerShare !== undefined
      ? {
          share: Number(rawLot.farmerShare) || 0,
          level: rawLot?.farmerShareLevel || "moderate",
          label: rawLot?.farmerShareLabel || "Moderate",
          consumerPrice: finalPrice,
        }
      : getFarmerShare(farmerPrice);

  const nextPrice =
    firstNumber(
      rawLot?.nextPrice,
      rawLot?.pricing?.next,
      priceJourney?.[currentStageIndex + 1]?.price
    ) ?? null;

  return {
    id,
    name,
    quantity,
    farmerPrice,
    currentPrice,
    stage,
    priceJourney,
    farmerShare: farmerShareInfo.share,
    nextPrice,
    currentStageIndex,
    finalPrice: farmerShareInfo.consumerPrice ?? finalPrice,
    farmerShareLevel: farmerShareInfo.level,
    farmerShareLabel: farmerShareInfo.label,
    isComplete: currentStageIndex >= stages.length - 1 || stage === "Consumer",
    createdAt: rawLot?.createdAt || rawLot?.timestamp || rawLot?.updatedAt || null,
    updatedAt: rawLot?.updatedAt || rawLot?.createdAt || null,
    originLocation: firstNonEmpty(rawLot?.originLocation, rawLot?.origin, rawLot?.location, rawLot?.farmLocation) || null,
    currentLocation:
      firstNonEmpty(
        rawLot?.currentLocation,
        rawLot?.location,
        rawLot?.logistics?.currentLocation,
        rawLot?.supplyChainSteps?.[rawLot?.supplyChainSteps?.length - 1]?.location
      ) || null,
    farmerName: firstNonEmpty(rawLot?.farmerName, rawLot?.producerName, rawLot?.ownerName) || null,
    trustScore: firstNumber(rawLot?.trustScore, rawLot?.blockchain?.trustScore) ?? null,
    isFlagged: Boolean(rawLot?.isFlagged),
    flagReason: firstNonEmpty(rawLot?.flagReason, rawLot?.fraudReason) || "",
    blockchainId: firstNonEmpty(rawLot?.blockchainId, rawLot?.batchId, rawLot?.onChainBatchId) || null,
    logistics: rawLot?.logistics || rawLot?.realtime?.logistics || null,
    supplyChainSteps: Array.isArray(rawLot?.supplyChainSteps) ? rawLot.supplyChainSteps : [],
    priceHistory: Array.isArray(rawLot?.priceHistory) ? rawLot.priceHistory : [],
    transactionHashes: Array.isArray(rawLot?.transactionHashes) ? rawLot.transactionHashes : [],
    ownershipHistory: Array.isArray(rawLot?.ownershipHistory) ? rawLot.ownershipHistory : [],
  };
}

export function normalizeLotsData(rawLots = []) {
  return (Array.isArray(rawLots) ? rawLots : []).map((lot) => normalizeLotData(lot));
}
