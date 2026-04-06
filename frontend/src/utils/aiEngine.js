import { computePriceBreakdown, getPriceAtStage, stages } from "./supplyChain";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function average(values = []) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function createFactor(label, value, weight, direction, description) {
  return {
    label,
    value: clamp(Math.round(value), 0, 100),
    weight,
    direction,
    description,
    weightedContribution: Math.round(clamp(value, 0, 100) * weight),
  };
}

function normalizeTransactions(transactions = [], productName = "") {
  const lowerName = String(productName || "").toLowerCase();

  return (Array.isArray(transactions) ? transactions : []).filter((entry) => {
    const haystack = `${entry?.title || ""} ${entry?.message || ""} ${entry?.batch?.name || ""} ${entry?.snapshot?.name || ""}`.toLowerCase();
    return lowerName ? haystack.includes(lowerName) : true;
  });
}

function summarizeTransactionHistory(transactions = []) {
  const recentTransactions = transactions.slice(0, 8);
  const priceUpdates = recentTransactions.filter((entry) =>
    `${entry?.action || ""} ${entry?.title || ""}`.toLowerCase().includes("price")
  );
  const soldEvents = recentTransactions.filter((entry) =>
    `${entry?.action || ""} ${entry?.title || ""} ${entry?.message || ""}`.toLowerCase().includes("sold")
  );
  const createdEvents = recentTransactions.filter((entry) =>
    `${entry?.action || ""} ${entry?.title || ""}`.toLowerCase().includes("created")
  );

  return {
    count: recentTransactions.length,
    priceUpdates: priceUpdates.length,
    soldEvents: soldEvents.length,
    createdEvents: createdEvents.length,
    staleHistory: recentTransactions.length < 2,
    signalStrength: clamp(recentTransactions.length * 14 + priceUpdates.length * 8 + soldEvents.length * 10, 0, 100),
  };
}

function buildWeightedSignals({
  productName,
  quantity,
  farmerPrice,
  stageIndex,
  currentPrice,
  finalPrice,
  totalGrowthPercent,
  supplyChainMargin,
  transactions,
}) {
  const safeQuantity = Number(quantity) || 0;
  const lowerName = String(productName || "").toLowerCase();
  const isHighlyPerishable = ["tomato", "mango", "banana", "cabbage"].includes(lowerName);
  const isWeatherSensitive = ["tomato", "mango", "onion", "banana"].includes(lowerName);
  const transactionHistory = summarizeTransactionHistory(transactions);

  const priceTrend = clamp(42 + totalGrowthPercent * 0.22 + stageIndex * 9 - transactionHistory.staleHistory * 10, 8, 96);
  const spoilageRisk = clamp(18 + stageIndex * 16 + (isHighlyPerishable ? 14 : 4) - safeQuantity * 0.05, 6, 94);
  const weatherRisk = clamp(24 + (isWeatherSensitive ? 20 : 8) + stageIndex * 6 - transactionHistory.signalStrength * 0.08, 8, 88);
  const logisticsDelay = clamp(16 + stageIndex * 15 + Math.max(transactionHistory.count - transactionHistory.priceUpdates, 0) * 4, 5, 92);
  const demandSpike = clamp(28 + safeQuantity * 0.18 + transactionHistory.soldEvents * 14 + transactionHistory.createdEvents * 5, 6, 97);
  const historicalMargin = clamp(32 + supplyChainMargin * 0.7 + (currentPrice > farmerPrice ? 8 : 0), 8, 95);

  const factors = [
    createFactor(
      "Price trend",
      priceTrend,
      0.22,
      "positive",
      `Observed markup trend is ${priceTrend >= 60 ? "constructive" : "muted"} across the current stage history.`
    ),
    createFactor(
      "Spoilage risk",
      spoilageRisk,
      0.2,
      "negative",
      `${stages[stageIndex]} stage plus crop perishability implies ${spoilageRisk >= 60 ? "high" : "manageable"} spoilage pressure.`
    ),
    createFactor(
      "Weather risk",
      weatherRisk,
      0.14,
      "negative",
      `Weather sensitivity for ${productName} is ${weatherRisk >= 55 ? "material" : "limited"} in the current window.`
    ),
    createFactor(
      "Logistics delay",
      logisticsDelay,
      0.14,
      "negative",
      `Recent lifecycle activity suggests ${logisticsDelay >= 55 ? "meaningful" : "limited"} delay friction.`
    ),
    createFactor(
      "Demand spike",
      demandSpike,
      0.16,
      "positive",
      `Recent activity and lot size indicate ${demandSpike >= 60 ? "strong" : "steady"} downstream demand.`
    ),
    createFactor(
      "Historical margin",
      historicalMargin,
      0.14,
      "positive",
      `Historical margin retention is ${historicalMargin >= 60 ? "supportive" : "thin"} for the current chain economics.`
    ),
  ];

  return {
    factors,
    transactionHistory,
  };
}

function buildExplainability({
  recommendation,
  confidence,
  factors,
  stageName,
  currentPrice,
  finalPrice,
  farmerShare,
  transactionHistory,
}) {
  const strongestPositive = factors
    .filter((factor) => factor.direction === "positive")
    .sort((a, b) => b.value - a.value)[0];
  const strongestNegative = factors
    .filter((factor) => factor.direction === "negative")
    .sort((a, b) => b.value - a.value)[0];

  const recommendationReasonMap = {
    BUY: "Buy is favored when upside signals remain stronger than spoilage and delay risk.",
    SELL: "Sell is favored when value has already been realized and risk is rising faster than expected upside.",
    HOLD: "Hold is favored when the signal mix is balanced and waiting may preserve optionality.",
  };

  const reasoningBullets = [
    `Current stage is ${stageName}, where realized value is Rs. ${currentPrice.toLocaleString("en-IN")} per kg against a consumer potential of Rs. ${finalPrice.toLocaleString("en-IN")}.`,
    `Farmer share is ${farmerShare}% and the strongest positive signal is ${strongestPositive?.label || "price trend"} at ${strongestPositive?.value || 0}/100.`,
    `The main caution signal is ${strongestNegative?.label || "spoilage risk"} at ${strongestNegative?.value || 0}/100, which reduces confidence in aggressive forecasts.`,
    `Recent batch activity contributes ${transactionHistory.signalStrength}/100 signal strength from ${transactionHistory.count} recent transaction events.`,
  ];

  const trendExplanation = `The stage-by-stage curve suggests pricing has moved from origin to market without assuming perfect continuation. Confidence is constrained by recent signal quality and transaction depth, not just the size of the markup.`;
  const whyRecommendation = `${recommendationReasonMap[recommendation]} This recommendation is intentionally conservative because the engine weights both upside and operational risk instead of extrapolating best-case growth.`;

  const explainabilityText = `The recommendation leans on ${strongestPositive?.label || "market momentum"} for upside, but tempers that with ${strongestNegative?.label || "risk"} so the output stays believable rather than overconfident.`;

  return {
    reasoningBullets,
    trendExplanation,
    whyRecommendation,
    explainabilityText,
    confidenceNarrative:
      confidence < 60
        ? "Confidence is low because the signal mix is either weak, contradictory, or based on limited recent history."
        : "Confidence is supported by a balanced mix of price, demand, risk, and recent transaction signals.",
  };
}

export function analyzeProduct({
  productName,
  quantity,
  farmerPrice,
  stageIndex,
  transactions = [],
}) {
  const safeFarmerPrice = Number(farmerPrice) || 0;
  const safeQuantity = Number(quantity) || 0;
  const safeStageIndex = clamp(Number(stageIndex) || 0, 0, stages.length - 1);
  const currentPrice = getPriceAtStage(safeFarmerPrice, safeStageIndex);
  const finalPrice = getPriceAtStage(safeFarmerPrice, stages.length - 1);
  const stageName = stages[safeStageIndex] || "Farmer";
  const breakdown = computePriceBreakdown(safeFarmerPrice);
  const farmerShare = finalPrice > 0 ? Math.round((safeFarmerPrice / finalPrice) * 100) : 100;
  const supplyChainMargin = 100 - farmerShare;
  const totalGrowth = finalPrice - safeFarmerPrice;
  const totalGrowthPercent = safeFarmerPrice > 0 ? Math.round((totalGrowth / safeFarmerPrice) * 100) : 0;
  const normalizedTransactions = normalizeTransactions(transactions, productName);

  const stageBreakdown = stages.map((stage, index) => {
    const price = getPriceAtStage(safeFarmerPrice, index);
    const previous = index > 0 ? getPriceAtStage(safeFarmerPrice, index - 1) : safeFarmerPrice;
    const markup = index > 0 && previous > 0 ? Math.round(((price - previous) / previous) * 100) : 0;

    return {
      stage,
      price,
      markup,
      isCurrent: index === safeStageIndex,
    };
  });

  const anomalies = [];
  for (let index = 1; index < stageBreakdown.length; index += 1) {
    if (stageBreakdown[index].markup > 30) {
      anomalies.push({
        from: stageBreakdown[index - 1].stage,
        to: stageBreakdown[index].stage,
        jump: stageBreakdown[index].markup,
        fromPrice: stageBreakdown[index - 1].price,
        toPrice: stageBreakdown[index].price,
      });
    }
  }

  const insufficientData =
    !productName ||
    safeQuantity <= 0 ||
    safeFarmerPrice <= 0 ||
    normalizedTransactions.length < 2;

  if (insufficientData) {
    return {
      productName,
      quantity: safeQuantity,
      farmerPrice: safeFarmerPrice,
      currentPrice,
      finalPrice,
      stageName,
      stageIndex: safeStageIndex,
      breakdown,
      stageBreakdown,
      priceHistory: stageBreakdown,
      factors: [],
      confidence: 0,
      lowConfidence: true,
      insufficientData: true,
      insufficientDataReason:
        "There is not enough recent batch transaction history or commercial input data to produce a trustworthy recommendation.",
      recommendation: "HOLD",
      movement: {
        next24h: { percent: 0, direction: "flat", explanation: "Insufficient data for a short-term forecast." },
        next7d: { percent: 0, direction: "flat", explanation: "Insufficient data for a medium-term forecast." },
      },
      reasoningBullets: [
        "The engine requires stronger recent batch activity to avoid presenting a false sense of certainty.",
        "Add more recent lifecycle or transaction events before relying on this recommendation.",
      ],
      trendExplanation: "Trend confidence is currently too weak to justify a directional recommendation.",
      whyRecommendation: "The system falls back to a neutral stance when inputs are incomplete.",
      explainabilityText: "This is a conservative fallback designed to avoid fake precision.",
      confidenceNarrative: "Confidence is low because recent transaction history is too sparse.",
      farmerShare,
      supplyChainMargin,
      totalGrowth,
      totalGrowthPercent,
      fairnessLevel: farmerShare >= 50 ? "fair" : farmerShare >= 30 ? "moderate" : "unfair",
      fairnessMessage: "Insufficient data for high-confidence forecasting",
      prediction: "Prediction withheld until enough data is available.",
      predictionIcon: "FLAT",
      suggestion: "Collect more recent batch and transaction history.",
      suggestionAction: "hold",
      anomalies,
      estimatedRevenue: currentPrice * safeQuantity,
      potentialRevenue: finalPrice * safeQuantity,
      signalQuality: 0,
      recentTransactionCount: normalizedTransactions.length,
    };
  }

  const { factors, transactionHistory } = buildWeightedSignals({
    productName,
    quantity: safeQuantity,
    farmerPrice: safeFarmerPrice,
    stageIndex: safeStageIndex,
    currentPrice,
    finalPrice,
    totalGrowthPercent,
    supplyChainMargin,
    transactions: normalizedTransactions,
  });

  const positiveScore = factors
    .filter((factor) => factor.direction === "positive")
    .reduce((sum, factor) => sum + factor.value * factor.weight, 0);
  const negativeScore = factors
    .filter((factor) => factor.direction === "negative")
    .reduce((sum, factor) => sum + factor.value * factor.weight, 0);
  const netScore = positiveScore - negativeScore;

  let recommendation = "HOLD";
  if (netScore >= 8) {
    recommendation = "BUY";
  } else if (netScore <= -6 || safeStageIndex >= 3) {
    recommendation = "SELL";
  }

  const signalSpread = Math.abs(positiveScore - negativeScore);
  const confidence = clamp(
    Math.round(38 + signalSpread * 8 + transactionHistory.signalStrength * 0.22 - anomalies.length * 4),
    32,
    92
  );
  const lowConfidence = confidence < 60;

  const movement24hRaw = Math.round(positiveScore * 0.22 - negativeScore * 0.18);
  const movement7dRaw = Math.round(positiveScore * 0.35 - negativeScore * 0.24);
  const projected24h = clamp(movement24hRaw, -8, 10);
  const projected7d = clamp(movement7dRaw, -12, 15);

  const explainability = buildExplainability({
    recommendation,
    confidence,
    factors,
    stageName,
    currentPrice,
    finalPrice,
    farmerShare,
    transactionHistory,
  });

  return {
    productName,
    quantity: safeQuantity,
    farmerPrice: safeFarmerPrice,
    currentPrice,
    finalPrice,
    stageName,
    stageIndex: safeStageIndex,
    breakdown,
    stageBreakdown,
    priceHistory: stageBreakdown,
    factors,
    confidence,
    lowConfidence,
    insufficientData: false,
    insufficientDataReason: "",
    recommendation,
    reasoningBullets: explainability.reasoningBullets,
    trendExplanation: explainability.trendExplanation,
    whyRecommendation: explainability.whyRecommendation,
    explainabilityText: explainability.explainabilityText,
    confidenceNarrative: explainability.confidenceNarrative,
    movement: {
      next24h: {
        percent: projected24h,
        direction: projected24h > 0 ? "up" : projected24h < 0 ? "down" : "flat",
        explanation:
          projected24h > 0
            ? "Near-term upside exists, but it is moderated by risk-weighted scoring."
            : projected24h < 0
              ? "Near-term downside risk outweighs upside in the current signal mix."
              : "Short-term movement appears balanced and directionally weak.",
      },
      next7d: {
        percent: projected7d,
        direction: projected7d > 0 ? "up" : projected7d < 0 ? "down" : "flat",
        explanation:
          projected7d > 0
            ? "Medium-term movement remains positive, though confidence is capped by operational uncertainty."
            : projected7d < 0
              ? "Medium-term pressure is negative because risk signals persist beyond the current stage."
              : "The seven-day signal is neutral given the available history.",
      },
    },
    farmerShare,
    supplyChainMargin,
    totalGrowth,
    totalGrowthPercent,
    fairnessLevel: farmerShare >= 50 ? "fair" : farmerShare >= 30 ? "moderate" : "unfair",
    fairnessMessage:
      farmerShare >= 50
        ? "Strong farmer value retention"
        : farmerShare >= 30
          ? "Moderate distribution efficiency"
          : "Supply chain heavily favors middle layers",
    prediction:
      recommendation === "BUY"
        ? "Upside exists, but the recommendation should still be treated as risk-weighted rather than guaranteed."
        : recommendation === "SELL"
          ? "Risk is overtaking expected upside, so monetizing earlier appears more defensible."
          : "Signals are mixed, so a neutral hold is more trustworthy than forcing directional certainty.",
    predictionIcon:
      recommendation === "BUY" ? "UP" : recommendation === "SELL" ? "DOWN" : "FLAT",
    suggestion:
      recommendation === "BUY"
        ? "Consider buying only if operational execution remains tight."
        : recommendation === "SELL"
          ? "Consider selling while current realized value still outweighs the risk stack."
          : "Hold until stronger transaction history or demand evidence improves confidence.",
    suggestionAction: recommendation.toLowerCase(),
    anomalies,
    estimatedRevenue: currentPrice * safeQuantity,
    potentialRevenue: finalPrice * safeQuantity,
    signalQuality: transactionHistory.signalStrength,
    recentTransactionCount: normalizedTransactions.length,
  };
}
