require("dotenv").config();

const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");

const connectDB = require("./database");
const { seedDatabaseIfEmpty, seedFallbackIfEmpty } = require("./utils/sampleData");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  })
);
app.use(express.json());

let dbTestStatus = "untested";

app.get("/api/health", (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status: "ok",
    database: isConnected ? "connected" : "disconnected",
    dbTest: dbTestStatus
  });
});

app.use("/api/batches", require("./routes/batches"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/ai", require("./routes/ai"));

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

async function runDbTest() {
  try {
    const TestModel = mongoose.models.Test || mongoose.model("Test", new mongoose.Schema({ name: String }));
    const doc = await TestModel.create({ name: "test-doc" });
    const fetched = await TestModel.findById(doc._id);
    await TestModel.findByIdAndDelete(doc._id);
    if (fetched && fetched.name === "test-doc") {
      console.log("MongoDB READ/WRITE working");
      dbTestStatus = "passed";
      return true;
    }
  } catch (error) {
    console.error("MongoDB READ/WRITE test failed:", error.message);
  }
  console.log("MongoDB NOT working");
  dbTestStatus = "failed";
  return false;
}

async function startServer() {
  try {
    const dbState = await connectDB();
    if (dbState?.connected) {
      const isTestPassed = await runDbTest();
      if (isTestPassed) {
        const seeded = await seedDatabaseIfEmpty();
        if (seeded) {
          console.log("Inserted default sample product lots into MongoDB");
        }
      } else {
        console.log("Running in fallback mode");
        const seeded = seedFallbackIfEmpty();
        if (seeded) {
          console.log("Loaded default sample product lots into fallback memory store");
        }
      }
    } else {
      console.log("Running in fallback mode");
      const seeded = seedFallbackIfEmpty();
      if (seeded) {
        console.log("Loaded default sample product lots into fallback memory store");
      }
    }
  } catch (error) {
    console.error("Database initialization warning:", error.message || error);
    console.log("Running in fallback mode");
    const seeded = seedFallbackIfEmpty();
    if (seeded) {
      console.log("Loaded default sample product lots into fallback memory store");
    }
  }

  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    console.log("Server running even if DB not connected");
  });
}

startServer();
