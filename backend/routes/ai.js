const express = require("express");

const router = express.Router();

const baselinePrices = {
  tomato: 36,
  tomatoes: 36,
  rice: 58,
  basmati: 72,
  mango: 95,
  potato: 28,
  potatoes: 28,
  onion: 32,
  wheat: 40,
  banana: 34,
};

function getBaselinePrice(productName) {
  const normalized = String(productName || "").toLowerCase();
  const matchedKey = Object.keys(baselinePrices).find((key) => normalized.includes(key));
  return matchedKey ? baselinePrices[matchedKey] : 50;
}

function buildPrediction({ productName, quantity, price }) {
  const normalizedQuantity = Number(quantity);
  const normalizedPrice = Number(price);
  const baselinePrice = getBaselinePrice(productName);
  const reasons = [];
  let score = 0;

  if (normalizedQuantity < 120) {
    score += 2;
    reasons.push("Lower available stock can push prices upward.");
  } else if (normalizedQuantity > 500) {
    score -= 2;
    reasons.push("Higher inventory suggests oversupply pressure in local markets.");
  } else {
    reasons.push("Current stock level is balanced for regular distribution demand.");
  }

  if (normalizedPrice < baselinePrice * 0.9) {
    score += 2;
    reasons.push("Current price is below the typical market benchmark, leaving room for appreciation.");
  } else if (normalizedPrice > baselinePrice * 1.15) {
    score -= 2;
    reasons.push("Current price is already above benchmark, which may slow buyer demand.");
  } else {
    reasons.push("Current price is close to benchmark and likely to stay stable.");
  }

  if (/(organic|premium|fresh|export)/i.test(productName)) {
    score += 1;
    reasons.push("Higher-grade produce tends to attract stronger demand and better margins.");
  }

  const direction = score >= 1 ? "increase" : score <= -1 ? "decrease" : "stable";
  const movePercent = direction === "stable" ? 2 : Math.min(15, Math.max(4, Math.abs(score) * 4));
  const predictedPrice =
    direction === "increase"
      ? normalizedPrice * (1 + movePercent / 100)
      : direction === "decrease"
        ? normalizedPrice * (1 - movePercent / 100)
        : normalizedPrice * 1.02;
  const suggestion = direction === "increase" ? "Hold stock" : "Sell now";

  return {
    productName,
    currentPrice: normalizedPrice,
    quantity: normalizedQuantity,
    prediction: direction,
    suggestedPrice: Number(predictedPrice.toFixed(2)),
    suggestion,
    confidence: score === 0 ? "medium" : Math.abs(score) >= 3 ? "high" : "medium",
    reason: reasons.join(" "),
    factors: reasons,
  };
}

router.post("/predict", async (req, res) => {
  try {
    const { productName, quantity, price } = req.body;

    if (!productName || quantity === undefined || price === undefined) {
      return res.status(400).json({
        error: "productName, quantity, and price are required",
      });
    }

    const normalizedQuantity = Number(quantity);
    const normalizedPrice = Number(price);

    if (!Number.isFinite(normalizedQuantity) || !Number.isFinite(normalizedPrice)) {
      return res.status(400).json({
        error: "quantity and price must be valid numbers",
      });
    }

    const result = buildPrediction({
      productName: String(productName).trim(),
      quantity: normalizedQuantity,
      price: normalizedPrice,
    });

    return res.json({
      success: true,
      result,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to generate AI prediction" });
  }
});

module.exports = router;
