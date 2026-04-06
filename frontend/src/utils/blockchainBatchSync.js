import { normalizeLotData } from "./normalizeLotData";

export function getNextBatchUpdate(batch = {}) {
  const currentStageIndex = Number(batch?.currentStageIndex ?? 0);
  const nextStageIndex = Math.min(currentStageIndex + 1, 4);

  if (currentStageIndex <= 0) {
    return {
      status: "Processing",
      nextStageIndex,
      price: Number(batch?.currentPrice ?? batch?.farmerPrice ?? 0),
    };
  }

  if (currentStageIndex === 1) {
    return {
      status: "Distributor",
      nextStageIndex,
      price: Number(batch?.currentPrice ?? 0),
    };
  }

  if (currentStageIndex === 2) {
    return {
      status: "Retail",
      nextStageIndex,
      price: Number(batch?.nextPrice ?? batch?.currentPrice ?? 0),
    };
  }

  return {
    status: "Consumer",
    nextStageIndex,
    price: Number(batch?.currentPrice ?? 0),
  };
}

export function applyBlockchainBatchAdvance(batch = {}, txHash = "") {
  const nextUpdate = getNextBatchUpdate(batch);
  const transactionHashes = Array.isArray(batch?.transactionHashes) ? batch.transactionHashes : [];

  return normalizeLotData({
    ...batch,
    stage: nextUpdate.status,
    status: nextUpdate.status,
    currentStageIndex: nextUpdate.nextStageIndex,
    currentPrice: nextUpdate.price,
    price: nextUpdate.price,
    updatedAt: new Date().toISOString(),
    transactionHashes: txHash ? [txHash, ...transactionHashes] : transactionHashes,
  });
}
