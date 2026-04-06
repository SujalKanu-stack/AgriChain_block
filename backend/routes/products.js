const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const bc = require("../utils/blockchain");

// POST /api/products - Create a new product
router.post("/", async (req, res) => {
  try {
    const { name, origin, currentLocation, price, farmerName, quantity, harvestDate, actorAddress } = req.body;

    if (!name || !origin || !currentLocation || !price) {
      return res.status(400).json({ error: "Missing required fields: name, origin, currentLocation, price" });
    }

    // Create blockchain batch first
    const batchId = await bc.createBatch({
      productName: name,
      farmerName: farmerName || "Unknown Farmer",
      location: currentLocation,
      quantity: parseInt(quantity) || 1,
      farmerPrice: parseInt(price),
      harvestDate: harvestDate ? Math.floor(new Date(harvestDate).getTime() / 1000) : Math.floor(Date.now() / 1000),
      actorAddress
    });

    // Create product in MongoDB
    const product = new Product({
      name,
      origin,
      currentLocation,
      price: parseInt(price),
      farmerName,
      quantity: parseInt(quantity) || 1,
      harvestDate: harvestDate ? new Date(harvestDate) : new Date(),
      blockchainId: batchId,
      history: [{
        stage: 'Harvested',
        location: currentLocation,
        actor: farmerName,
        notes: 'Product created'
      }]
    });

    await product.save();

    // Create transaction record
    const transaction = new Transaction({
      productId: product._id,
      from: origin,
      to: currentLocation,
      type: 'creation',
      actor: farmerName,
      notes: 'Product created'
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      product: product,
      transaction: transaction,
      blockchainId: batchId,
      message: `Product created with ID ${product._id}`
    });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products - Get all products
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { origin: { $regex: search, $options: 'i' } },
        { farmerName: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('transactions');

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id - Get single product with history
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const transactions = await Transaction.find({ productId: req.params.id })
      .sort({ timestamp: -1 });

    res.json({
      product,
      transactions,
      history: product.history
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id/location - Update product location
router.put("/:id/location", async (req, res) => {
  try {
    const { location, stage, notes, actor, carrier, trackingNumber, actorAddress } = req.body;

    if (!location || !stage) {
      return res.status(400).json({ error: "Location and stage are required" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const oldLocation = product.currentLocation;

    // Update blockchain
    if (stage === 'In Transit' || stage === 'At Warehouse') {
      await bc.updateShipment({
        batchId: product.blockchainId,
        location,
        notes: notes || "",
        actorAddress,
        carrier: carrier || "",
        trackingNumber: trackingNumber || ""
      });
    }

    // Update MongoDB
    product.currentLocation = location;
    product.history.push({
      stage,
      location,
      actor,
      notes,
      carrier,
      trackingNumber,
      timestamp: new Date()
    });

    await product.save();

    // Create transaction record
    const transaction = new Transaction({
      productId: product._id,
      from: oldLocation,
      to: location,
      type: 'shipment',
      actor,
      notes,
      carrier,
      trackingNumber
    });

    await transaction.save();

    res.json({
      success: true,
      product,
      transaction,
      message: "Product location updated"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id/price - Update product price
router.put("/:id/price", async (req, res) => {
  try {
    const { price, notes, actor, actorAddress } = req.body;

    if (!price) {
      return res.status(400).json({ error: "Price is required" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update blockchain
    await bc.updateRetailPrice({
      batchId: product.blockchainId,
      newPrice: parseInt(price),
      notes: notes || "",
      actorAddress
    });

    // Update MongoDB
    product.price = parseInt(price);
    product.history.push({
      stage: 'At Retail',
      location: product.currentLocation,
      actor,
      notes: `Price updated to ${price}`,
      timestamp: new Date()
    });

    await product.save();

    // Create transaction record
    const transaction = new Transaction({
      productId: product._id,
      from: product.currentLocation,
      to: product.currentLocation,
      type: 'price_update',
      actor,
      notes,
      price: parseInt(price)
    });

    await transaction.save();

    res.json({
      success: true,
      product,
      transaction,
      message: "Product price updated"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id/sale - Confirm sale
router.put("/:id/sale", async (req, res) => {
  try {
    const { location, notes, actor, actorAddress } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update blockchain
    await bc.confirmSale({
      batchId: product.blockchainId,
      location: location || "Consumer Purchase Point",
      notes: notes || "Consumer confirmed purchase",
      actorAddress
    });

    // Update MongoDB
    product.currentLocation = location || "Sold";
    product.history.push({
      stage: 'Sold',
      location: location || "Consumer Purchase Point",
      actor,
      notes,
      timestamp: new Date()
    });

    await product.save();

    // Create transaction record
    const transaction = new Transaction({
      productId: product._id,
      from: product.currentLocation,
      to: location || "Sold",
      type: 'sale',
      actor,
      notes
    });

    await transaction.save();

    res.json({
      success: true,
      product,
      transaction,
      message: "Sale confirmed"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id - Delete product (admin only)
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete related transactions
    await Transaction.deleteMany({ productId: req.params.id });

    res.json({
      success: true,
      message: "Product and related transactions deleted"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;