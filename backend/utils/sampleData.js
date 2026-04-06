const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const fallbackStore = require("./fallbackStore");

const SAMPLE_LOTS = [
  { name: "Tomatoes", quantity: 100, price: 40, status: "Farmer" },
  { name: "Onions", quantity: 80, price: 30, status: "Distributor" },
  { name: "Rice", quantity: 200, price: 60, status: "Retailer" },
  { name: "Wheat", quantity: 150, price: 25, status: "Farmer" },
];

async function seedDatabaseIfEmpty() {
  const count = await Product.countDocuments();
  if (count > 0) {
    return false;
  }

  const createdLots = await Product.insertMany(SAMPLE_LOTS);
  const transactions = createdLots.map((lot) => ({
    batchId: lot._id,
    action: "created",
    message: `Product lot "${lot.name}" created`,
    snapshot: {
      name: lot.name,
      quantity: lot.quantity,
      price: lot.price,
      status: lot.status,
    },
  }));

  await Transaction.insertMany(transactions);
  return true;
}

function seedFallbackIfEmpty() {
  if (fallbackStore.getBatches().length > 0) {
    return false;
  }

  SAMPLE_LOTS.forEach((lot) => {
    const created = fallbackStore.createBatch(lot);
    fallbackStore.addTransaction({
      batch: created,
      action: "created",
      message: `Product lot "${created.name}" created`,
    });
  });

  return true;
}

module.exports = {
  SAMPLE_LOTS,
  seedDatabaseIfEmpty,
  seedFallbackIfEmpty,
};
