/**
 * Deterministic supply chain price engine.
 * NO randomness. All prices are computed from a fixed farmer base price.
 *
 * Processing:  +15%
 * Distributor: +20% of previous
 * Retail:      +25% of previous
 * Consumer:    +20% of previous
 *
 * Example (₹20 base):
 *   Farmer ₹20 → Processing ₹23 → Distributor ₹28 → Retail ₹35 → Consumer ₹42
 */

export const stages = ["Farmer", "Processing", "Distributor", "Retail", "Consumer"];

// Cumulative multipliers from farmer base price
// Farmer=1, Processing=×1.15, Distributor=×1.15×1.20, Retail=×1.15×1.20×1.25, Consumer=×1.15×1.20×1.25×1.20
const MULTIPLIERS = [
  1,          // Farmer
  1.15,       // Processing   (+15%)
  1.38,       // Distributor  (×1.20 of Processing)
  1.725,      // Retail       (×1.25 of Distributor)
  2.07,       // Consumer     (×1.20 of Retail)
];

/**
 * Compute the full price breakdown at creation time.
 * All downstream values are derived deterministically from farmerPrice.
 */
export function computePriceBreakdown(farmerPrice) {
  const base = Number(farmerPrice) || 0;
  return {
    farmer:      Math.round(base * MULTIPLIERS[0]),
    processing:  Math.round(base * MULTIPLIERS[1]),
    distributor: Math.round(base * MULTIPLIERS[2]),
    retail:      Math.round(base * MULTIPLIERS[3]),
    consumer:    Math.round(base * MULTIPLIERS[4]),
  };
}

export function getStageByIndex(index) {
  return stages[Math.min(Math.max(index, 0), stages.length - 1)];
}

/** Returns the deterministic price at a given stage index. */
export function getPriceAtStage(farmerPrice, stageIndex) {
  const idx = Math.min(Math.max(stageIndex, 0), MULTIPLIERS.length - 1);
  return Math.round(Number(farmerPrice) * MULTIPLIERS[idx]);
}

/** Returns the full price trend array for the mini-card visualization. */
export function getPriceTrend(farmerPrice) {
  return stages.map((stage, i) => ({
    stage,
    price: Math.round(Number(farmerPrice) * MULTIPLIERS[i]),
  }));
}

export function getNextStageMessage(stageIndex) {
  if (stageIndex >= stages.length - 1) return "Delivered to Consumer ✅";
  return `Ready to move to ${stages[stageIndex + 1]}`;
}

/**
 * Farmer share and transparency score.
 * farmerShare = (farmerPrice / consumerPrice) * 100
 *
 * >50%      → Fair     (green)
 * 30–50%    → Moderate (yellow)
 * <30%      → Unfair   (red)
 */
export function getFarmerShare(farmerPrice) {
  const bd = computePriceBreakdown(farmerPrice);
  const share = bd.consumer > 0
    ? Math.round((bd.farmer / bd.consumer) * 100)
    : 100;

  let level, label;
  if (share > 50) {
    level = "fair";
    label = "Fair ✅";
  } else if (share >= 30) {
    level = "moderate";
    label = "Moderate ⚠️";
  } else {
    level = "unfair";
    label = "Unfair ❌";
  }

  return { share, level, label, consumerPrice: bd.consumer };
}

/**
 * Enriches a raw product record with all computed supply-chain fields.
 * Accepts products from the API (which may have only `price`) or
 * newly-created records with `basePrice`.
 */
export function enrichProduct(product) {
  const farmerPrice = product.basePrice ?? product.price ?? 0;
  const stageIndex  = product.currentStageIndex ?? 0;
  const stage       = getStageByIndex(stageIndex);
  const currentPrice = getPriceAtStage(farmerPrice, stageIndex);
  const growth      = currentPrice - farmerPrice;
  const growthPct   = farmerPrice > 0 ? Math.round((growth / farmerPrice) * 100) : 0;
  const farmerInfo  = getFarmerShare(farmerPrice);
  const breakdown   = computePriceBreakdown(farmerPrice);

  return {
    ...product,
    basePrice:          farmerPrice,
    currentStageIndex:  stageIndex,
    stage,
    currentPrice,
    priceGrowth:        growth,
    priceGrowthPercent: growthPct,
    priceBreakdown:     breakdown,
    statusMessage:      getNextStageMessage(stageIndex),
    isComplete:         stageIndex >= stages.length - 1,
    farmerShare:        farmerInfo.share,
    farmerShareLevel:   farmerInfo.level,
    farmerShareLabel:   farmerInfo.label,
    finalPrice:         farmerInfo.consumerPrice,
  };
}
