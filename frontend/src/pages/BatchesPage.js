import React, { useEffect, useState } from "react";

import { useBlockchain } from "../components/BlockchainProvider";
import { useToast } from "../components/Toast";
import BatchCard from "../components/BatchCard";
import { EmptyBatches } from "../components/EmptyState";
import { LoadingGrid } from "../components/Loading";
import PageHeader from "../components/PageHeader";
import { getBatches, updateBatch } from "../utils/api";
import { applyBlockchainBatchAdvance } from "../utils/blockchainBatchSync";
import { generateMockData } from "../utils/mockData";
import { normalizeLotsData } from "../utils/normalizeLotData";

export default function BatchesPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState("");
  const { demoMode, transferOwnershipTransaction } = useBlockchain();
  const { error, success } = useToast();

  useEffect(() => {
    const loadLots = async () => {
      setLoading(true);
      let raw = [];

      try {
        const response = await getBatches();
        if (response?.data?.batches?.length) {
          raw = response.data.batches;
        } else {
          raw = generateMockData(150);
        }
      } catch (requestError) {
        raw = generateMockData(150);
      }

      setProducts(normalizeLotsData(raw));
      setLoading(false);
    };

    loadLots();
  }, []);

  const handleMoveNext = async (batch) => {
    setMovingId(batch.id);

    try {
      const tx = await transferOwnershipTransaction(batch, {
        location: batch.currentLocation || batch.originLocation || "Supply Chain Route",
      });

      const nextBatch = applyBlockchainBatchAdvance(batch, tx?.hash || "");
      setProducts((current) =>
        current.map((product) => (product?.id === batch.id ? nextBatch : product))
      );

      try {
        await updateBatch(batch.id, {
          status: nextBatch.stage,
          price: nextBatch.currentPrice,
          txHash: tx?.hash || "",
          transactionHashes: nextBatch.transactionHashes,
        });
      } catch (requestError) {
        // Keep local UI in sync even when API persistence is unavailable.
      }

      success(
        demoMode
          ? "Demo ownership transfer completed."
          : "Live ownership transfer transaction signed successfully."
      );
    } catch (requestError) {
      error(requestError?.message || "Ownership transfer failed.");
    } finally {
      setMovingId("");
    }
  };

  return (
    <section className="page-section">
      <PageHeader
        eyebrow="Product Lots"
        title="Manage every product lot through the supply chain"
        description='Move a lot to the next stage with a real MetaMask transaction, or use demo mode as a backup.'
      />

      {loading ? (
        <LoadingGrid cards={6} />
      ) : products.length === 0 ? (
        <div className="glass-card">
          <EmptyBatches />
        </div>
      ) : (
        <div className="lot-grid">
          {products.map((lot) => (
            <BatchCard
              key={lot.id}
              batch={lot}
              isMoving={movingId === lot.id}
              onMoveNext={() => handleMoveNext(lot)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
