import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useBlockchain } from "../components/BlockchainProvider";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";
import { useSupplyChainData } from "../hooks/useSupplyChainData";
import RoleDashboardPage from "../components/dashboard/RoleDashboardPage";
import { updateBatch } from "../utils/api";
import { buildConsumerDashboard } from "../utils/roleDashboardData";

export default function ConsumerPage() {
  const { demoMode, consumerVerificationTransaction } = useBlockchain();
  const { error, success } = useToast();
  const { products, reload } = useSupplyChainData();
  const [verifyingId, setVerifyingId] = useState("");

  const verifiableLots = useMemo(
    () =>
      products.filter((product) =>
        ["Retail", "Consumer"].includes(product?.stage)
      ).slice(0, 4),
    [products]
  );

  const handleVerify = async (lot) => {
    setVerifyingId(lot.id);

    try {
      const tx = await consumerVerificationTransaction(lot, {
        location: lot.currentLocation || "Consumer verification",
      });
      try {
        await updateBatch(lot.id, {
          status: "Consumer",
          price: lot.currentPrice,
          txHash: tx?.hash || "",
          transactionHashes: tx?.hash
            ? [tx.hash, ...(lot.transactionHashes || [])]
            : lot.transactionHashes || [],
        });
      } catch (requestError) {
        // Keep consumer verification available even if API persistence is unavailable.
      }
      await reload();
      success(
        demoMode
          ? "Demo consumer verification completed."
          : "Live consumer verification transaction signed successfully."
      );
    } catch (requestError) {
      error(requestError?.message || "Consumer verification failed.");
    } finally {
      setVerifyingId("");
    }
  };

  return (
    <>
      <RoleDashboardPage
        eyebrow="Consumer Role"
        title="Consumer Dashboard"
        description="Expose QR verification, trust scoring, and end-to-end product journey transparency for buyers."
        accent="#8b5cf6"
        buildData={buildConsumerDashboard}
      />

      <section className="page-section">
        <div className="glass-card shipment-detail-card">
          <div className="section-heading">
            <h3>Consumer AI Inspection</h3>
            <p>Upload crop or packaged product images and get a multilingual quality and freshness report.</p>
          </div>
          <div className="role-widget-action">
            <Link to="/consumer-ai" className="button button-primary">
              Open Consumer AI
            </Link>
          </div>
        </div>

        <div className="glass-card shipment-detail-card">
          <div className="section-heading">
            <h3>Consumer Verification</h3>
            <p>Use MetaMask to confirm final ownership and proof-of-purchase on chain.</p>
          </div>

          {verifiableLots.length ? (
            <div className="tx-feed-list">
              {verifiableLots.map((lot) => (
                <div key={lot.id} className="tx-feed-row">
                  <div>
                    <strong>{lot.name}</strong>
                    <p>
                      {lot.stage} · {lot.currentLocation || lot.originLocation || "Traceable lot"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => handleVerify(lot)}
                    disabled={verifyingId === lot.id}
                  >
                    {verifyingId === lot.id
                      ? "Verifying..."
                      : demoMode
                        ? "Demo Verify"
                        : "Verify With MetaMask"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No consumer-ready lots"
              description="Retail-stage lots will appear here for final consumer verification."
            />
          )}
        </div>
      </section>
    </>
  );
}
