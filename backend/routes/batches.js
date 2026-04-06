const express = require("express");

const connectDB = require("../database");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const fallbackStore = require("../utils/fallbackStore");

const router = express.Router();

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isDatabaseConnected() {
  return connectDB.isDatabaseConnected();
}

function normalizeBatch(batch) {
  const source = typeof batch.toJSON === "function" ? batch.toJSON() : { ...batch };
  return {
    id: String(source.id || source._id),
    name: source.name,
    quantity: Number(source.quantity),
    price: Number(source.price),
    stage: source.status || source.stage || "Farmer",
    blockchainId: source.blockchainId ?? null,
    txHash: source.txHash || "",
    farmerName: source.farmerName || "",
    originLocation: source.originLocation || "",
    transactionHashes: Array.isArray(source.transactionHashes) ? source.transactionHashes : [],
    createdAt: source.createdAt,
    updatedAt: source.updatedAt || source.createdAt,
  };
}

async function recordTransaction(batch, action, message) {
  const normalizedBatch = normalizeBatch(batch);

  if (!isDatabaseConnected()) {
    fallbackStore.addTransaction({ batch: normalizedBatch, action, message });
    return;
  }

  try {
    await Transaction.create({
      batchId: batch._id,
      action,
      message,
      snapshot: {
        name: normalizedBatch.name,
        quantity: normalizedBatch.quantity,
        price: normalizedBatch.price,
        status: normalizedBatch.status,
      },
    });
  } catch (error) {
    fallbackStore.addTransaction({ batch: normalizedBatch, action, message });
  }
}

function handleRouteError(res, error, fallbackMessage) {
  if (error.name === "CastError" || error.name === "ValidationError") {
    return res.status(400).json({ error: error.message });
  }

  return res.status(500).json({ error: error.message || fallbackMessage });
}

function buildUpdateTransaction(previousBatch, nextBatch, updates) {
  if (
    (updates.status === "Consumer" || updates.status === "Completed") &&
    previousBatch.status !== "Consumer" &&
    previousBatch.status !== "Completed"
  ) {
    return {
      action: "sold",
      message: `Product lot "${nextBatch.name}" reached the consumer stage`,
    };
  }

  if (updates.price !== undefined && Number(updates.price) !== Number(previousBatch.price)) {
    return {
      action: "price_updated",
      message: `Market price updated for "${nextBatch.name}" from Rs. ${previousBatch.price} to Rs. ${nextBatch.price}`,
    };
  }

  return {
    action: "updated",
    message: `Product lot "${nextBatch.name}" updated`,
  };
}

router.post("/", async (req, res) => {
  const { name, quantity, price, status, blockchainId, txHash, farmerName, originLocation } = req.body;
  const parsedQuantity = parseNumber(quantity);
  const parsedPrice = parseNumber(price);

  if (!name || parsedQuantity == null || parsedPrice == null) {
    return res.status(400).json({ error: "name, quantity, and price are required" });
  }

  const input = {
    name: String(name).trim(),
    quantity: parsedQuantity,
    price: parsedPrice,
    status: status || "Farmer",
    blockchainId: blockchainId ?? null,
    txHash: txHash || "",
    farmerName: farmerName || "",
    originLocation: originLocation || "",
    transactionHashes: txHash ? [txHash] : [],
  };

  if (!isDatabaseConnected()) {
    const batch = fallbackStore.createBatch(input);
    fallbackStore.addTransaction({
      batch,
      action: "created",
      message: `Product lot "${batch.name}" created`,
    });

    return res.status(201).json({
      success: true,
      batch,
      demoMode: true,
      message: "Product lot created successfully using in-memory fallback",
    });
  }

  try {
    const batch = await Product.create(input);
    await recordTransaction(batch, "created", `Product lot "${batch.name}" created`);

    return res.status(201).json({
      success: true,
      batch: normalizeBatch(batch),
      demoMode: false,
      message: "Product lot created successfully",
    });
  } catch (error) {
    const batch = fallbackStore.createBatch(input);
    fallbackStore.addTransaction({
      batch,
      action: "created",
      message: `Product lot "${batch.name}" created`,
    });

    return res.status(201).json({
      success: true,
      batch,
      demoMode: true,
      message: "Database failed, product lot created using in-memory fallback",
    });
  }
});

router.get("/", async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.json({
      success: true,
      batches: fallbackStore.getBatches(),
      demoMode: true,
    });
  }

  try {
    const batches = await Product.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      batches: batches.map(normalizeBatch),
      demoMode: false,
    });
  } catch (error) {
    return res.json({
      success: true,
      batches: fallbackStore.getBatches(),
      demoMode: true,
    });
  }
});

router.get("/:id", async (req, res) => {
  if (!isDatabaseConnected()) {
    const batch = fallbackStore.getBatch(req.params.id);
    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    return res.json({
      success: true,
      batch,
      demoMode: true,
    });
  }

  try {
    const batch = await Product.findById(req.params.id);
    if (!batch) {
      const fallbackBatch = fallbackStore.getBatch(req.params.id);
      if (!fallbackBatch) {
        return res.status(404).json({ error: "Batch not found" });
      }

      return res.json({
        success: true,
        batch: fallbackBatch,
        demoMode: true,
      });
    }

    return res.json({
      success: true,
      batch: normalizeBatch(batch),
      demoMode: false,
    });
  } catch (error) {
    const fallbackBatch = fallbackStore.getBatch(req.params.id);
    if (fallbackBatch) {
      return res.json({
        success: true,
        batch: fallbackBatch,
        demoMode: true,
      });
    }

    return handleRouteError(res, error, "Failed to fetch batch");
  }
});

router.put("/:id", async (req, res) => {
  const updates = {};

  if (req.body.name !== undefined) {
    updates.name = String(req.body.name).trim();
  }

  if (req.body.quantity !== undefined) {
    const parsedQuantity = parseNumber(req.body.quantity);
    if (parsedQuantity == null) {
      return res.status(400).json({ error: "quantity must be a valid number" });
    }
    updates.quantity = parsedQuantity;
  }

  if (req.body.price !== undefined) {
    const parsedPrice = parseNumber(req.body.price);
    if (parsedPrice == null) {
      return res.status(400).json({ error: "price must be a valid number" });
    }
    updates.price = parsedPrice;
  }

  if (req.body.status !== undefined) {
    updates.status = req.body.status;
  }

  if (req.body.blockchainId !== undefined) {
    updates.blockchainId = req.body.blockchainId;
  }

  if (req.body.txHash !== undefined) {
    updates.txHash = req.body.txHash;
  }

  if (req.body.farmerName !== undefined) {
    updates.farmerName = String(req.body.farmerName).trim();
  }

  if (req.body.originLocation !== undefined) {
    updates.originLocation = String(req.body.originLocation).trim();
  }

  if (req.body.transactionHashes !== undefined && Array.isArray(req.body.transactionHashes)) {
    updates.transactionHashes = req.body.transactionHashes;
  }

  if (!isDatabaseConnected()) {
    const previousBatch = fallbackStore.getBatch(req.params.id);
    if (!previousBatch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    const batch = fallbackStore.updateBatch(req.params.id, updates);
    const transactionEntry = buildUpdateTransaction(previousBatch, batch, updates);
    fallbackStore.addTransaction({
      batch,
      action: transactionEntry.action,
      message: transactionEntry.message,
    });

    return res.json({
      success: true,
      batch,
      demoMode: true,
      message: "Product lot updated using in-memory fallback",
    });
  }

  try {
    const previousBatch = await Product.findById(req.params.id);
    if (!previousBatch) {
      const fallbackBatch = fallbackStore.getBatch(req.params.id);
      if (!fallbackBatch) {
        return res.status(404).json({ error: "Batch not found" });
      }

      const batch = fallbackStore.updateBatch(req.params.id, updates);
      return res.json({
        success: true,
        batch,
        demoMode: true,
        message: "Product lot updated using in-memory fallback",
      });
    }

    const batch = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    const transactionEntry = buildUpdateTransaction(normalizeBatch(previousBatch), normalizeBatch(batch), updates);
    await recordTransaction(batch, transactionEntry.action, transactionEntry.message);

    return res.json({
      success: true,
      batch: normalizeBatch(batch),
      demoMode: false,
      message: "Product lot updated successfully",
    });
  } catch (error) {
    const previousBatch = fallbackStore.getBatch(req.params.id);
    if (previousBatch) {
      const batch = fallbackStore.updateBatch(req.params.id, updates);
      const transactionEntry = buildUpdateTransaction(previousBatch, batch, updates);
      fallbackStore.addTransaction({
        batch,
        action: transactionEntry.action,
        message: transactionEntry.message,
      });

      return res.json({
        success: true,
        batch,
        demoMode: true,
        message: "Database failed, product lot updated using in-memory fallback",
      });
    }

    return handleRouteError(res, error, "Failed to update batch");
  }
});

module.exports = router;
