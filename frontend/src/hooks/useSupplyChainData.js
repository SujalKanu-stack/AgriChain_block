import { useCallback, useEffect, useState } from "react";

import { getBatches, getTransactions } from "../utils/api";
import { generateMockData, generateMockLogs } from "../utils/mockData";
import { normalizeLotsData } from "../utils/normalizeLotData";

function toFeedEntry(entry = {}) {
  return {
    id: entry?.id || `${entry?.action || "event"}-${entry?.createdAt || entry?.timestamp || Date.now()}`,
    title: String(entry?.action || "timeline_event")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()),
    message: entry?.message || "Supply chain activity recorded.",
    timestamp: entry?.createdAt || entry?.timestamp || new Date().toISOString(),
  };
}

export function useSupplyChainData() {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);

    const [batchesResult, transactionsResult] = await Promise.allSettled([
      getBatches(),
      getTransactions(),
    ]);

    let nextProducts = [];

    if (batchesResult.status === "fulfilled" && batchesResult.value?.data?.batches?.length) {
      nextProducts = batchesResult.value.data.batches;
    } else {
      nextProducts = normalizeLotsData(generateMockData(150));
    }

    let nextTransactions = [];

    if (
      transactionsResult.status === "fulfilled" &&
      Array.isArray(transactionsResult.value?.data?.transactions) &&
      transactionsResult.value.data.transactions.length > 0
    ) {
      nextTransactions = transactionsResult.value.data.transactions.map(toFeedEntry);
    } else {
      nextTransactions = generateMockLogs(nextProducts).map(toFeedEntry);
    }

    setProducts(nextProducts);
    setTransactions(nextTransactions);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { products, transactions, loading, setProducts, setTransactions, reload };
}
