const mongoose = require("mongoose");
require("dotenv").config();

const ATLAS_URI = process.env.MONGO_URI;

const dbState = {
  connected: false,
  activeUri: null,
};

async function tryConnect(uri, retries = 3) {
  while (retries > 0) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      dbState.connected = true;
      dbState.activeUri = uri;
      console.log("MongoDB connected successfully");
      return true;
    } catch (error) {
      console.error(`MongoDB connection attempt failed. Retries left: ${retries - 1}`);
      console.error("Exact error:", error.message);
      retries -= 1;
      if (retries === 0) {
        return false;
      }
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
  return false;
}

async function connectDB() {
  if (dbState.connected) {
    return dbState;
  }

  if (!ATLAS_URI) {
    console.error("Exact error: MONGO_URI is not defined in .env");
    console.error("MongoDB NOT working");
    dbState.connected = false;
    return dbState;
  }

  const success = await tryConnect(ATLAS_URI);
  if (!success) {
    console.error("MongoDB NOT working");
    dbState.connected = false;
    dbState.activeUri = null;
  }
  return dbState;
}

function isDatabaseConnected() {
  return dbState.connected && mongoose.connection.readyState === 1;
}

function getDatabaseState() {
  return {
    connected: isDatabaseConnected(),
    activeUri: dbState.activeUri,
  };
}

module.exports = connectDB;
module.exports.isDatabaseConnected = isDatabaseConnected;
module.exports.getDatabaseState = getDatabaseState;
