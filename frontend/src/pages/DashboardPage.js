import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Boxes,
  ChartNoAxesCombined,
  CircleDollarSign,
  IndianRupee,
  Truck,
} from "lucide-react";

import BatchCard from "../components/BatchCard";
import { useBlockchain } from "../components/BlockchainProvider";
import { useToast } from "../components/Toast";
import { EmptyState } from "../components/EmptyState";
import { LoadingGrid, LoadingTimeline } from "../components/Loading";
import DashboardAreaChartCard from "../components/dashboard/DashboardAreaChartCard";
import DashboardKpiGrid from "../components/dashboard/DashboardKpiGrid";
import DashboardTimelineCard from "../components/dashboard/DashboardTimelineCard";
import { getBatches, getTransactions } from "../utils/api";
import { applyBlockchainBatchAdvance } from "../utils/blockchainBatchSync";
import { analyzeProduct } from "../utils/aiEngine";
import { generateMockData } from "../utils/mockData";
import { normalizeLotsData } from "../utils/normalizeLotData";
import { stages } from "../utils/supplyChain";

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

function buildFallbackFeed(lots = []) {
  return lots
    .slice()
    .sort((a, b) => new Date(b?.updatedAt || b?.createdAt || 0) - new Date(a?.updatedAt || a?.createdAt || 0))
    .slice(0, 6)
    .map((lot, index) => ({
      id: `${lot.id}-feed-${index}`,
      title: lot?.isComplete ? "Settled On Chain" : "Stage Sync",
      message: `${lot?.name || "Batch"} is currently in ${lot?.stage || "Farmer"} with current price Rs. ${Number(
        lot?.currentPrice ?? 0
      ).toLocaleString("en-IN")}.`,
      timestamp: lot?.updatedAt || lot?.createdAt || new Date().toISOString(),
    }));
}

function formatFeedEntry(entry = {}) {
  return {
    id: entry?.id || `${entry?.action || "feed"}-${entry?.createdAt || entry?.timestamp || Date.now()}`,
    title: String(entry?.action || "chain_event")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()),
    message: entry?.message || "Blockchain event recorded",
    timestamp: entry?.createdAt || entry?.timestamp || new Date().toISOString(),
  };
}

export default function DashboardPage() {
  const { demoMode, transferOwnershipTransaction } = useBlockchain();
  const { error, success } = useToast();
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState("");
  const [activePanel, setActivePanel] = useState("insight");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const [batchesResult, transactionsResult] = await Promise.allSettled([
        getBatches(),
        getTransactions(),
      ]);

      let nextProducts = [];

      if (batchesResult.status === "fulfilled" && batchesResult.value?.data?.batches?.length) {
        nextProducts = normalizeLotsData(batchesResult.value.data.batches);
      } else {
        nextProducts = normalizeLotsData(generateMockData(150));
      }

      let nextTransactions = [];

      if (
        transactionsResult.status === "fulfilled" &&
        Array.isArray(transactionsResult.value?.data?.transactions) &&
        transactionsResult.value.data.transactions.length > 0
      ) {
        nextTransactions = transactionsResult.value.data.transactions.map(formatFeedEntry);
      } else {
        nextTransactions = buildFallbackFeed(nextProducts);
      }

      setProducts(nextProducts);
      setTransactions(nextTransactions);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleMoveNext = async (batch) => {
    setMovingId(batch.id);

    try {
      const tx = await transferOwnershipTransaction(batch, {
        location: batch.currentLocation || batch.originLocation || "Dashboard handoff",
      });

      setProducts((current) =>
        current.map((product) =>
          product?.id === batch.id ? applyBlockchainBatchAdvance(product, tx?.hash || "") : product
        )
      );

      success(
        demoMode
          ? "Demo handoff completed from the dashboard."
          : "Live ownership transfer signed from the dashboard."
      );
    } catch (requestError) {
      error(requestError?.message || "Failed to move the batch forward.");
    } finally {
      setMovingId("");
    }
  };

  const dashboardData = useMemo(() => {
    const totalBatches = products.length;
    const inTransit = products.filter((product) => !product?.isComplete).length;
    const avgFarmerPrice = totalBatches
      ? Math.round(products.reduce((sum, product) => sum + Number(product?.farmerPrice ?? 0), 0) / totalBatches)
      : 0;
    const consumerPrice = totalBatches
      ? Math.round(products.reduce((sum, product) => sum + Number(product?.finalPrice ?? 0), 0) / totalBatches)
      : 0;
    const growthPercent =
      avgFarmerPrice > 0 ? Math.round(((consumerPrice - avgFarmerPrice) / avgFarmerPrice) * 100) : 0;

    const chartData = stages.map((stage, stageIndex) => {
      const stagePrices = products
        .map((product) => product?.priceJourney?.[stageIndex]?.price)
        .filter((price) => Number.isFinite(price));

      const totalPrice = stagePrices.reduce((sum, price) => sum + Number(price || 0), 0);

      return {
        label: stage,
        value: stagePrices.length ? Math.round(totalPrice / stagePrices.length) : 0,
      };
    });

    const pipeline = stages.map((stage) => {
      const count = products.filter((product) => product?.stage === stage).length;
      const percentage = totalBatches > 0 ? Math.round((count / totalBatches) * 100) : 0;
      return { stage, count, percentage };
    });

    const mostValuableLot =
      products
        .slice()
        .sort((a, b) => Number(b?.currentPrice ?? 0) - Number(a?.currentPrice ?? 0))[0] || null;

    const aiInsight = mostValuableLot
      ? analyzeProduct({
          productName: mostValuableLot.name,
          quantity: Number(mostValuableLot.quantity ?? 0),
          farmerPrice: Number(mostValuableLot.farmerPrice ?? 0),
          stageIndex: Number(mostValuableLot.currentStageIndex ?? 0),
        })
      : null;

    return {
      kpis: [
        { label: "Total Batches", value: totalBatches, icon: Boxes },
        { label: "In Transit", value: inTransit, icon: Truck },
        { label: "Avg Farmer Price", value: avgFarmerPrice, icon: IndianRupee, prefix: "Rs. " },
        { label: "Consumer Price", value: consumerPrice, icon: CircleDollarSign, prefix: "Rs. " },
        { label: "Growth %", value: growthPercent, icon: ChartNoAxesCombined, suffix: "%" },
      ],
      chartData,
      pipeline,
      aiInsight,
      spotlightLots: products.slice(0, 4),
      completedDeliveries: products.filter((product) => product?.isComplete).length,
      inTransit,
    };
  }, [products]);

  return (
    <section className="page-section dashboard-premium">
      {loading ? (
        <div className="dashboard-premium-grid">
          <LoadingGrid cards={5} className="kpi-grid" />
          <div className="dashboard-analytics-layout">
            <div className="glass-card analytics-chart-card">
              <LoadingTimeline items={1} />
            </div>
            <div className="glass-card pipeline-card">
              <LoadingTimeline items={4} />
            </div>
          </div>
          <div className="dashboard-secondary-shell glass-card">
            <LoadingTimeline items={3} />
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="glass-card empty-state-card">
          <EmptyState
            title="No supply data yet"
            description="Create a product lot to unlock pricing analytics, pipeline visibility, and blockchain activity."
          />
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="dashboard-premium-grid">
          <motion.div variants={itemVariants}>
            <DashboardKpiGrid items={dashboardData.kpis} />
          </motion.div>

          <motion.div variants={itemVariants} className="dashboard-analytics-layout">
            <DashboardAreaChartCard
              title="Price Evolution"
              description="Average realized value across the full chain, using normalized live batch pricing."
              data={dashboardData.chartData}
              dataKey="value"
              color="#10b981"
              valueFormatter={(value) => `Rs.${value}`}
            />

            <div className="dashboard-side-stack">
              <div className="glass-card pipeline-card">
                <div className="section-heading">
                  <h3>Shipment Pipeline</h3>
                  <p>Normalized lifecycle distribution across active lots.</p>
                </div>
                <div className="pipeline-list">
                  {dashboardData.pipeline.map((step) => (
                    <div key={step.stage} className="pipeline-row">
                      <div className="pipeline-row-top">
                        <strong>{step.stage}</strong>
                        <span>
                          {step.count} lots
                          <em>{step.percentage}%</em>
                        </span>
                      </div>
                      <div className="pipeline-bar">
                        <motion.div
                          className="pipeline-bar-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${step.percentage}%` }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="dashboard-analytics-layout dashboard-activity-layout">
            <DashboardTimelineCard
              title="Blockchain Activity Feed"
              description="Recent synchronized lifecycle and on-chain events."
              items={transactions.slice(0, 6)}
            />
            <div className="glass-card dashboard-mini-summary">
              <div className="section-heading">
                <h3>Snapshot</h3>
                <p>Fast read on fulfillment and chain coverage.</p>
              </div>
              <div className="dashboard-mini-summary-list">
                <div className="dashboard-mini-summary-item">
                  <span>Completed deliveries</span>
                  <strong>{dashboardData.completedDeliveries}</strong>
                </div>
                <div className="dashboard-mini-summary-item">
                  <span>Blockchain events</span>
                  <strong>{transactions.length}</strong>
                </div>
                <div className="dashboard-mini-summary-item">
                  <span>Actively moving</span>
                  <strong>{dashboardData.inTransit}</strong>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-card dashboard-secondary-shell">
            <div className="dashboard-secondary-header">
              <div className="section-heading">
                <h3>Secondary Intelligence</h3>
                <p>Lower-priority views tucked beneath the primary dashboard fold.</p>
              </div>
              <div className="dashboard-secondary-tabs" role="tablist" aria-label="Dashboard secondary panels">
                <button
                  type="button"
                  className={`dashboard-tab${activePanel === "insight" ? " active" : ""}`}
                  onClick={() => setActivePanel("insight")}
                >
                  AI Insight
                </button>
                <button
                  type="button"
                  className={`dashboard-tab${activePanel === "lots" ? " active" : ""}`}
                  onClick={() => setActivePanel("lots")}
                >
                  Priority Lots
                </button>
                <button
                  type="button"
                  className={`dashboard-tab${activePanel === "summary" ? " active" : ""}`}
                  onClick={() => setActivePanel("summary")}
                >
                  Summary
                </button>
              </div>
            </div>

            {activePanel === "insight" ? (
              <div className="ai-summary-card dashboard-secondary-panel">
                <div className="section-heading">
                  <h3>AI Pricing Insight</h3>
                  <p>Generated from the highest-value normalized batch in the current view.</p>
                </div>

                {dashboardData.aiInsight ? (
                  <div className="ai-summary-body">
                    <div className="ai-summary-title">
                      <div className="feature-chip">
                        <Bot size={16} />
                        <span>{dashboardData.aiInsight.productName}</span>
                      </div>
                      <strong>{dashboardData.aiInsight.fairnessMessage}</strong>
                    </div>

                    <div className="ai-summary-metrics">
                      <div className="ai-summary-metric">
                        <span>Current Stage</span>
                        <strong>{dashboardData.aiInsight.stageName}</strong>
                      </div>
                      <div className="ai-summary-metric">
                        <span>Farmer Share</span>
                        <strong>{dashboardData.aiInsight.farmerShare}%</strong>
                      </div>
                      <div className="ai-summary-metric">
                        <span>Total Growth</span>
                        <strong>Rs. {dashboardData.aiInsight.totalGrowth.toLocaleString("en-IN")}</strong>
                      </div>
                    </div>

                    <div className="ai-suggestion-box">
                      <strong>{dashboardData.aiInsight.prediction}</strong>
                      <p>{dashboardData.aiInsight.suggestion}</p>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={Bot}
                    title="No AI insight yet"
                    description="A highlighted batch will appear here once product data is available."
                  />
                )}
              </div>
            ) : null}

            {activePanel === "lots" ? (
              <div className="spotlight-card dashboard-secondary-panel">
                <div className="section-heading">
                  <h3>Priority Lots</h3>
                  <p>Highest-visibility lots moving through the current lifecycle view.</p>
                </div>
                {dashboardData.spotlightLots.length ? (
                  <div className="spotlight-lots">
                    {dashboardData.spotlightLots.map((item) => (
                      <BatchCard
                        key={item.id}
                        batch={item}
                        isMoving={movingId === item.id}
                        onMoveNext={() => handleMoveNext(item)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Boxes}
                    title="No priority lots"
                    description="Lots with the highest visibility will appear here automatically."
                  />
                )}
              </div>
            ) : null}

            {activePanel === "summary" ? (
              <div className="quick-summary-card dashboard-secondary-panel">
                <div className="section-heading">
                  <h3>Operations Summary</h3>
                  <p>Condensed operational context without crowding the primary fold.</p>
                </div>
                <div className="quick-summary-list minimal">
                  <div className="quick-summary-item">
                    <div>
                      <strong>{dashboardData.completedDeliveries} completed deliveries</strong>
                      <p>Consumer-stage lots already settled in the lifecycle.</p>
                    </div>
                  </div>
                  <div className="quick-summary-item">
                    <div>
                      <strong>{dashboardData.inTransit} lots actively moving</strong>
                      <p>Pipeline capacity remains concentrated in active distribution stages.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
