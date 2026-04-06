import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Blocks, Clock3, PackageSearch, ShieldAlert, Truck } from "lucide-react";

import { useBlockchain } from "../components/BlockchainProvider";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";
import { LoadingGrid, LoadingTimeline } from "../components/Loading";
import LoadingState from "../components/LoadingState";
import { useSupplyChainData } from "../hooks/useSupplyChainData";
import { getNextBatchUpdate } from "../utils/blockchainBatchSync";
import { updateBatch } from "../utils/api";
import { normalizeShipmentsData } from "../utils/normalizeShipmentData";

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: "easeOut" },
  },
};

export default function ShipmentTrackingPage() {
  const { demoMode, updateShipmentCheckpointTransaction } = useBlockchain();
  const { error, success } = useToast();
  const { products, transactions, loading, reload } = useSupplyChainData();
  const shipments = useMemo(
    () =>
      normalizeShipmentsData(products, transactions).filter(
        (shipment) => !shipment.isComplete || shipment.txFeed.length > 0
      ),
    [products, transactions]
  );
  const [selectedId, setSelectedId] = useState("");
  const [updatingCheckpoint, setUpdatingCheckpoint] = useState(false);

  const selectedShipment = useMemo(() => {
    if (!shipments.length) {
      return null;
    }

    return shipments.find((shipment) => shipment.id === selectedId) || shipments[0];
  }, [selectedId, shipments]);

  if (loading) {
    return (
      <section className="page-section">
        <div className="shipment-grid">
          <LoadingState
            message="Loading shipment tracking..."
            detail="Syncing lifecycle, checkpoint, and blockchain visuals."
          />
          <div className="shipment-layout">
            <LoadingGrid cards={3} />
            <LoadingTimeline items={4} />
          </div>
        </div>
      </section>
    );
  }

  if (!shipments.length) {
    return (
      <section className="page-section shipment-page">
        <div className="glass-card empty-state-card">
          <EmptyState
            icon={Truck}
            title="No shipment data yet"
            description="Route timelines, checkpoint events, and ownership handoffs will appear here once lots begin moving."
          />
        </div>
      </section>
    );
  }

  const handleCheckpointUpdate = async () => {
    if (!selectedShipment) {
      return;
    }

    setUpdatingCheckpoint(true);
    try {
      const tx = await updateShipmentCheckpointTransaction(selectedShipment, {
        location: selectedShipment.currentLocation || "Transit checkpoint",
      });
      const nextBatchUpdate = getNextBatchUpdate(selectedShipment);

      try {
        await updateBatch(selectedShipment.id, {
          status: nextBatchUpdate.status,
          price: nextBatchUpdate.price,
          txHash: tx?.hash || "",
          transactionHashes: tx?.hash
            ? [tx.hash, ...(selectedShipment.transactionHashes || [])]
            : selectedShipment.transactionHashes || [],
        });
      } catch (requestError) {
        // Keep blockchain flow usable even when API mirroring is unavailable.
      }
      await reload();
      success(
        demoMode
          ? "Demo checkpoint update recorded."
          : "Live shipment checkpoint transaction signed successfully."
      );
    } catch (requestError) {
      error(requestError?.message || "Checkpoint update failed.");
    } finally {
      setUpdatingCheckpoint(false);
    }
  };

  return (
    <section className="page-section shipment-page">
      <motion.div className="shipment-grid" variants={containerVariants} initial="hidden" animate="show">
        <motion.div variants={itemVariants} className="glass-card shipment-hero">
          <div>
            <div className="eyebrow">Logistics Tracking</div>
            <h2>Visualize route checkpoints, ownership handoffs, and blockchain events</h2>
            <p>
              Shipment tracking uses the current lifecycle plus safe blockchain and logistics adapters,
              so it works with mock state today and richer smart-contract payloads later.
            </p>
          </div>
          <div className="shipment-hero-stats">
            <div className="shipment-stat-chip">
              <Truck size={16} />
              <span>{shipments.length} tracked shipments</span>
            </div>
            <div className="shipment-stat-chip">
              <Blocks size={16} />
              <span>{shipments.reduce((sum, shipment) => sum + shipment.txFeed.length, 0)} tx events</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="shipment-layout">
          <div className="shipment-list">
            {shipments.map((shipment) => (
              <motion.button
                key={shipment.id}
                type="button"
                className={`glass-card shipment-card${selectedShipment?.id === shipment.id ? " active" : ""}`}
                onClick={() => setSelectedId(shipment.id)}
                whileHover={{ y: -2 }}
              >
                <div className="shipment-card-top">
                  <div>
                    <strong>{shipment.name}</strong>
                    <span>{shipment.originLocation || shipment.currentLocation || "Route pending"}</span>
                  </div>
                  <span className={`shipment-risk-badge ${shipment.risk.tone}`}>{shipment.risk.label}</span>
                </div>

                <div className="shipment-meta-row">
                  <span>
                    <Clock3 size={14} />
                    ETA: {shipment.eta}
                  </span>
                  <span>
                    <PackageSearch size={14} />
                    Batch #{shipment.shipmentId}
                  </span>
                </div>

                <div className="route-line">
                  {shipment.routeTimeline.map((step, index) => (
                    <React.Fragment key={`${shipment.id}-route-${index}`}>
                      <div className={`route-node${index === shipment.routeTimeline.length - 1 ? " active" : ""}`}>
                        <span />
                        <small>{step.stage}</small>
                      </div>
                      {index < shipment.routeTimeline.length - 1 && <div className="route-connector" />}
                    </React.Fragment>
                  ))}
                </div>

                <div className="checkpoint-list">
                  {shipment.checkpointEvents.slice(0, 2).map((checkpoint) => (
                    <div key={checkpoint.id} className="checkpoint-item">
                      <div className="checkpoint-copy">
                        <strong>{checkpoint.title}</strong>
                        <span>{checkpoint.location}</span>
                      </div>
                      <small>{new Date(checkpoint.timestamp).toLocaleString()}</small>
                    </div>
                  ))}
                </div>
              </motion.button>
            ))}
          </div>

          <div className="shipment-details">
            {selectedShipment ? (
              <>
                <motion.div variants={itemVariants} className="glass-card shipment-detail-card">
                  <div className="section-heading">
                    <h3>Route Timeline</h3>
                    <p>Checkpoint events and ETA derived from lifecycle state and logistics metadata.</p>
                  </div>

                  <div className="shipment-detail-top">
                    <div className="shipment-badge-cluster">
                      <span className={`shipment-risk-badge ${selectedShipment.risk.tone}`}>
                        {selectedShipment.risk.label}
                      </span>
                      <span className="shipment-risk-note">{selectedShipment.risk.detail}</span>
                    </div>
                    <div className="shipment-detail-actions">
                      <span className="shipment-eta-badge">ETA {selectedShipment.eta}</span>
                      {!selectedShipment.isComplete ? (
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={handleCheckpointUpdate}
                          disabled={updatingCheckpoint}
                        >
                          {updatingCheckpoint ? "Updating..." : demoMode ? "Demo Checkpoint" : "Sign Checkpoint"}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="checkpoint-event-list">
                    {selectedShipment.checkpointEvents.map((event) => (
                      <div key={event.id} className="checkpoint-event-row">
                        <div className="checkpoint-marker" />
                        <div className="checkpoint-event-copy">
                          <div className="checkpoint-event-top">
                            <strong>{event.title}</strong>
                            <span>{event.risk}</span>
                          </div>
                          <p>{event.location}</p>
                          <small>{new Date(event.timestamp).toLocaleString()} · {event.notes}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <div className="shipment-side-stack">
                  <motion.div variants={itemVariants} className="glass-card shipment-detail-card">
                    <div className="section-heading">
                      <h3>Ownership Transfer</h3>
                      <p>Role handoffs mapped from smart-contract stage semantics.</p>
                    </div>
                    <div className="ownership-list">
                      {selectedShipment.ownershipTimeline.map((entry) => (
                        <div key={entry.id} className="ownership-row">
                          <div className="ownership-avatar">{entry.owner?.slice(0, 1) || "S"}</div>
                          <div>
                            <strong>{entry.owner}</strong>
                            <p>{entry.stage} · {entry.location}</p>
                          </div>
                          <small>{new Date(entry.timestamp).toLocaleDateString()}</small>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="glass-card shipment-detail-card">
                    <div className="section-heading">
                      <h3>Tx Hash Feed</h3>
                      <p>
                        Block-linked events for this batch, with safe synthetic fallbacks when backend
                        data is partial.
                      </p>
                    </div>
                    <div className="tx-feed-list">
                      {selectedShipment.txFeed.map((tx) => (
                        <div key={tx.id} className="tx-feed-row">
                          <div>
                            <strong>{tx.label}</strong>
                            <p>
                              {tx.hash.slice(0, 18)}...{tx.hash.slice(-8)}
                            </p>
                          </div>
                          <div className="tx-feed-meta">
                            <span>Block {tx.blockNumber}</span>
                            <small>{new Date(tx.timestamp).toLocaleString()}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="glass-card shipment-summary-card">
                    <div className="summary-chip">
                      <ShieldAlert size={16} />
                      <span>Latest block {selectedShipment.latestBlock || "n/a"}</span>
                    </div>
                    <p>
                      Current owner chain, ETA, checkpoints, and tx entries are mapped from normalized lot
                      state plus blockchain-compatible adapter fields. Existing batch lifecycle remains unchanged.
                    </p>
                  </motion.div>
                </div>
              </>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
