import { normalizeLotData } from "./normalizeLotData";

const BLOCKCHAIN_STAGE_LABELS = ["Harvested", "In Transit", "At Warehouse", "At Retail", "Sold"];
const ROLE_BY_STAGE = ["Farmer", "Distributor", "Distributor", "Retailer", "Consumer"];
const LOCATION_BY_STAGE = [
  "Farm Origin",
  "Transit Corridor",
  "Regional Warehouse",
  "Retail Shelf",
  "Consumer Delivery",
];

function seedFromString(value = "") {
  return String(value)
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function shortHash(value = "") {
  const base = seedFromString(value).toString(16);
  return `0x${base.padStart(8, "0")}${base.padEnd(56, "a").slice(0, 56)}`;
}

function formatTimestamp(value) {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function buildFallbackSteps(lot) {
  const baseTime = new Date(lot?.createdAt || Date.now()).getTime();
  const stageIndex = Math.max(0, Math.min(Number(lot?.currentStageIndex ?? 0), BLOCKCHAIN_STAGE_LABELS.length - 1));

  return BLOCKCHAIN_STAGE_LABELS.slice(0, stageIndex + 1).map((stage, index) => ({
    stage,
    stageIndex: index,
    actor: ROLE_BY_STAGE[index],
    location:
      index === 0
        ? lot?.originLocation || "Farm Origin"
        : index === stageIndex
          ? lot?.currentLocation || LOCATION_BY_STAGE[index]
          : LOCATION_BY_STAGE[index],
    timestamp: formatTimestamp(baseTime + index * 1000 * 60 * 90),
    notes: `${stage} checkpoint recorded for ${lot?.name || "batch"}`,
  }));
}

function normalizeSteps(lot) {
  if (Array.isArray(lot?.supplyChainSteps) && lot.supplyChainSteps.length > 0) {
    return lot.supplyChainSteps.map((step, index) => ({
      stage: step?.stage || BLOCKCHAIN_STAGE_LABELS[index] || "Checkpoint",
      stageIndex: Number(step?.stageIndex ?? index),
      actor: step?.actor || ROLE_BY_STAGE[index] || "System",
      location: step?.location || LOCATION_BY_STAGE[index] || "Unknown Location",
      timestamp: formatTimestamp((step?.timestamp || Date.now()) * (String(step?.timestamp || "").length <= 10 ? 1000 : 1)),
      notes: step?.notes || "Lifecycle event recorded",
    }));
  }

  return buildFallbackSteps(lot);
}

function buildCheckpointEvents(steps, trustScore, flagReason) {
  return steps.map((step, index) => {
    const riskLevel =
      flagReason && index === steps.length - 1 ? "High" : trustScore != null && trustScore < 60 ? "Medium" : "Low";

    return {
      id: `${step.stage}-${index}`,
      title: step.stage,
      location: step.location,
      actor: step.actor,
      timestamp: step.timestamp,
      notes: step.notes,
      risk: riskLevel,
    };
  });
}

function buildOwnershipTimeline(steps) {
  return steps.map((step, index) => ({
    id: `${step.actor}-${index}`,
    owner: step.actor,
    stage: step.stage,
    location: step.location,
    timestamp: step.timestamp,
  }));
}

function buildTxFeed(lot, steps, transactions = []) {
  const transactionMatches = transactions.filter((entry) => {
    const text = `${entry?.message || ""} ${entry?.title || ""}`.toLowerCase();
    return text.includes(String(lot?.name || "").toLowerCase());
  });

  return steps.map((step, index) => {
    const matched = transactionMatches[index];
    const blockSeed = seedFromString(`${lot?.id}-${step.stage}-${index}`);
    const rawTimestamp = new Date(step.timestamp).getTime();

    return {
      id: `${lot?.id}-tx-${index}`,
      hash:
        matched?.hash ||
        matched?.txHash ||
        lot?.transactionHashes?.[index] ||
        shortHash(`${lot?.id}-${step.stage}-${step.timestamp}`),
      blockNumber: matched?.blockNumber || 21000000 + blockSeed,
      timestamp: formatTimestamp(rawTimestamp),
      label: matched?.title || `${step.stage} event`,
    };
  });
}

function buildEta(lot, steps, logistics) {
  if (lot?.isComplete) {
    return "Delivered";
  }

  if (logistics?.tracking?.expectedDelivery) {
    return new Date(logistics.tracking.expectedDelivery).toLocaleString();
  }

  const etaTime = new Date(steps[steps.length - 1]?.timestamp || Date.now()).getTime() + 1000 * 60 * 60 * 6;
  return new Date(etaTime).toLocaleString();
}

function buildRiskBadge(lot, logistics) {
  if (lot?.isFlagged) {
    return { label: "High Risk", tone: "high", detail: lot?.flagReason || "Blockchain anomaly detected" };
  }

  const logisticsRisk = logistics?.risk || logistics?.tracking?.status;
  if (String(logisticsRisk).toLowerCase().includes("high")) {
    return { label: "Elevated Risk", tone: "medium", detail: logistics?.note || "Transit conditions need attention" };
  }

  return { label: "Low Risk", tone: "low", detail: "Checkpoint chain is progressing normally" };
}

export function normalizeShipmentData(rawLot, transactions = []) {
  const lot = normalizeLotData(rawLot);
  const steps = normalizeSteps(lot);
  const checkpoints = buildCheckpointEvents(steps, lot?.trustScore, lot?.flagReason);
  const ownershipTimeline = buildOwnershipTimeline(steps);
  const txFeed = buildTxFeed(lot, steps, transactions);
  const risk = buildRiskBadge(lot, lot?.logistics);

  return {
    ...lot,
    shipmentId: lot?.blockchainId || lot?.id,
    eta: buildEta(lot, steps, lot?.logistics),
    risk,
    routeTimeline: steps,
    checkpointEvents: checkpoints,
    ownershipTimeline,
    txFeed,
    latestBlock: txFeed[txFeed.length - 1]?.blockNumber || null,
  };
}

export function normalizeShipmentsData(lots = [], transactions = []) {
  return (Array.isArray(lots) ? lots : []).map((lot) => normalizeShipmentData(lot, transactions));
}
