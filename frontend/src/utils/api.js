import axios from "axios";

import { normalizeLotData, normalizeLotsData } from "./normalizeLotData";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  timeout: 8000,
});

export async function checkHealth() {
  const response = await api.get("/health");
  return response.data;
}

function normalizeActivity(activity = {}) {
  return {
    id: String(activity?.id || activity?._id || `${Date.now()}-${Math.random()}`),
    action: activity?.action || "updated",
    message: activity?.message || "Product lot updated",
    batchId: String(activity?.batchId || activity?.batch?.id || activity?.batch?._id || ""),
    batch: activity?.batch ? normalizeLotData(activity.batch) : null,
    snapshot: activity?.snapshot ? normalizeLotData(activity.snapshot) : null,
    createdAt: activity?.createdAt || activity?.timestamp || new Date().toISOString(),
  };
}

export async function getBatches() {
  const response = await api.get("/batches");

  return {
    data: {
      ...response.data,
      batches: normalizeLotsData(response.data?.batches || []),
      demoMode: response.data?.demoMode || false,
    },
  };
}

export async function getBatch(id) {
  const response = await api.get(`/batches/${id}`);
  return {
    data: {
      ...response.data,
      batch: normalizeLotData(response.data?.batch),
      demoMode: response.data?.demoMode || false,
    },
  };
}

export async function createBatch(payload) {
  const response = await api.post("/batches", payload);
  return {
    data: {
      ...response.data,
      batch: normalizeLotData(response.data?.batch),
      demoMode: response.data?.demoMode || false,
    },
  };
}

export async function updateBatch(id, payload) {
  const response = await api.put(`/batches/${id}`, payload);
  return {
    data: {
      ...response.data,
      batch: normalizeLotData(response.data?.batch),
      demoMode: response.data?.demoMode || false,
    },
  };
}

export async function getTransactions() {
  const response = await api.get("/transactions");
  return {
    data: {
      ...response.data,
      transactions: (response.data?.transactions || []).map(normalizeActivity),
      demoMode: response.data?.demoMode || false,
    },
  };
}

export async function getPrediction(payload) {
  const response = await api.post("/ai/predict", payload);
  return {
    data: {
      ...response.data,
      demoMode: false,
    },
  };
}

export default api;
