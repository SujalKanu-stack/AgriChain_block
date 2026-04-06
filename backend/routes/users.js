const express = require("express");
const router = express.Router();
const User = require("../models/User");

// POST /api/users - Create a new user
router.post("/", async (req, res) => {
  try {
    const { name, email, role, walletAddress, profile } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    const user = new User({
      name,
      email,
      role: role || 'consumer',
      walletAddress,
      profile
    });

    await user.save();

    res.status(201).json({
      success: true,
      user,
      message: "User created successfully"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users - Get all users
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
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

// GET /api/users/:id - Get single user
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id - Update user
router.put("/:id", async (req, res) => {
  try {
    const { name, email, role, walletAddress, profile, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (walletAddress !== undefined) user.walletAddress = walletAddress;
    if (profile) user.profile = { ...user.profile, ...profile };
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      user,
      message: "User updated successfully"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:id - Delete user
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/stats - Get user statistics
router.get("/stats/overview", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);

    const activeUsers = await User.countDocuments({ isActive: true });

    res.json({
      totalUsers,
      activeUsers,
      usersByRole
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;