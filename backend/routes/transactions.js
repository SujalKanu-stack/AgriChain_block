const express = require("express");

const connectDB = require("../database");
const Transaction = require("../models/Transaction");
const fallbackStore = require("../utils/fallbackStore");

const router = express.Router();

function isDatabaseConnected() {
  return connectDB.isDatabaseConnected();
}

function handleRouteError(res, error, fallbackMessage) {
  if (error.name === "CastError") {
    return res.status(400).json({ error: error.message });
  }

  return res.status(500).json({ error: error.message || fallbackMessage });
}

router.get("/", async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.json({
      success: true,
      transactions: fallbackStore.getTransactions(),
      demoMode: true,
    });
  }

  try {
    const transactions = await Transaction.find()
      .populate("batchId", "name quantity price status createdAt updatedAt")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      transactions: transactions.map((transaction) => transaction.toJSON()),
      demoMode: false,
    });
  } catch (error) {
    return res.json({
      success: true,
      transactions: fallbackStore.getTransactions(),
      demoMode: true,
    });
  }
});

router.get("/:id", async (req, res) => {
  if (!isDatabaseConnected()) {
    const transaction = fallbackStore.getTransactions().find((item) => item.id === req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    return res.json({
      success: true,
      transaction,
      demoMode: true,
    });
  }

  try {
    const transaction = await Transaction.findById(req.params.id).populate(
      "batchId",
      "name quantity price status createdAt updatedAt"
    );

    if (!transaction) {
      const fallback = fallbackStore.getTransactions().find((item) => item.id === req.params.id);
      if (!fallback) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      return res.json({
        success: true,
        transaction: fallback,
        demoMode: true,
      });
    }

    return res.json({
      success: true,
      transaction: transaction.toJSON(),
      demoMode: false,
    });
  } catch (error) {
    const fallback = fallbackStore.getTransactions().find((item) => item.id === req.params.id);
    if (fallback) {
      return res.json({
        success: true,
        transaction: fallback,
        demoMode: true,
      });
    }

    return handleRouteError(res, error, "Failed to fetch transaction");
  }
});

module.exports = router;
