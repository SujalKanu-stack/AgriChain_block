const fallbackStore = {
  batches: [],
  transactions: [],
};

function buildBatchResponse(batch) {
  return {
    id: batch.id,
    name: batch.name,
    quantity: batch.quantity,
    price: batch.price,
    status: batch.status,
    blockchainId: batch.blockchainId ?? null,
    txHash: batch.txHash || "",
    farmerName: batch.farmerName || "",
    originLocation: batch.originLocation || "",
    transactionHashes: Array.isArray(batch.transactionHashes) ? batch.transactionHashes : [],
    createdAt: batch.createdAt,
    updatedAt: batch.updatedAt || batch.createdAt,
  };
}

function createBatch({ name, quantity, price, status, blockchainId, txHash, farmerName, originLocation }) {
  const now = new Date().toISOString();
  const batch = buildBatchResponse({
    id: `memory-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    quantity,
    price,
    status,
    blockchainId: blockchainId ?? null,
    txHash: txHash || "",
    farmerName: farmerName || "",
    originLocation: originLocation || "",
    transactionHashes: txHash ? [txHash] : [],
    createdAt: now,
    updatedAt: now,
  });

  fallbackStore.batches.unshift(batch);
  return batch;
}

function updateBatch(id, updates) {
  const batch = fallbackStore.batches.find((item) => item.id === id);
  if (!batch) {
    return null;
  }

  Object.assign(batch, updates, { updatedAt: new Date().toISOString() });
  return buildBatchResponse(batch);
}

function getBatch(id) {
  return fallbackStore.batches.find((item) => item.id === id) || null;
}

function getBatches() {
  return fallbackStore.batches.map(buildBatchResponse);
}

function addTransaction({ batch, action, message }) {
  const transaction = {
    id: `memory-tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    message,
    batchId: batch.id,
    batch: buildBatchResponse(batch),
    snapshot: {
      name: batch.name,
      quantity: batch.quantity,
      price: batch.price,
      status: batch.status,
      blockchainId: batch.blockchainId ?? null,
    },
    createdAt: new Date().toISOString(),
  };

  fallbackStore.transactions.unshift(transaction);
  return transaction;
}

function getTransactions() {
  return fallbackStore.transactions.map((transaction) => ({ ...transaction }));
}

module.exports = {
  createBatch,
  updateBatch,
  getBatch,
  getBatches,
  addTransaction,
  getTransactions,
};
