import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Globe2,
  Mic,
  ShieldAlert,
  Square,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useLanguage } from "../components/LanguageProvider";
import { EmptyState } from "../components/EmptyState";
import { getTransactions } from "../utils/api";
import { analyzeProduct } from "../utils/aiEngine";
import { productList } from "../utils/mockData";
import { stages } from "../utils/supplyChain";

const initialForm = {
  productName: "Tomato",
  quantity: "100",
  farmerPrice: "20",
  stageIndex: "0",
};

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
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: "easeOut" },
  },
};

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function buildVoiceNarration(result, recommendationLabel, t) {
  if (!result) {
    return "";
  }

  if (result.insufficientData) {
    return [
      `${t("ai.recommendationSummary", "Recommendation summary")}: ${recommendationLabel}.`,
      result.insufficientDataReason,
      result.confidenceNarrative,
    ].join(" ");
  }

  return [
    `${t("ai.recommendationSummary", "Recommendation summary")}: ${recommendationLabel}.`,
    `${t("ai.confidence", "Confidence")}: ${result.confidence} percent.`,
    result.whyRecommendation,
    result.trendExplanation,
    result.confidenceNarrative,
    `${t("ai.next24h", "Next 24h")}: ${result.movement.next24h.percent}% ${result.movement.next24h.direction}. ${result.movement.next24h.explanation}`,
    `${t("ai.next7d", "Next 7d")}: ${result.movement.next7d.percent}% ${result.movement.next7d.direction}. ${result.movement.next7d.explanation}`,
  ].join(" ");
}

export default function AIInsightsPage() {
  const { currentLanguage, t } = useLanguage();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const response = await getTransactions();
        setTransactions(response?.data?.transactions || []);
      } catch (error) {
        setTransactions([]);
      }
    };

    loadTransactions();
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);

    window.setTimeout(() => {
      const report = analyzeProduct({
        productName: form.productName,
        quantity: Number(form.quantity),
        farmerPrice: Number(form.farmerPrice),
        stageIndex: Number(form.stageIndex),
        transactions,
      });
      setResult(report);
      setLoading(false);
    }, 500);
  };

  const recommendationLabel = useMemo(() => {
    if (!result?.recommendation) {
      return "";
    }

    if (result.insufficientData) {
      return "Insufficient Data";
    }

    const key = result.recommendation.toLowerCase();
    return t(`ai.${key}`, result.recommendation);
  }, [result, t]);

  const voiceNarration = useMemo(
    () => buildVoiceNarration(result, recommendationLabel, t),
    [recommendationLabel, result, t]
  );

  const handleListen = () => {
    if (!voiceNarration || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(voiceNarration);
    utterance.lang = currentLanguage.speech;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleStopAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  return (
    <section className="page-section ai-insights-page">
      <div className="page-header ai-page-header">
        <div>
          <div className="eyebrow">{t("ai.eyebrow", "AI Insights")}</div>
          <h2>{t("ai.title", "Explainable market intelligence for farmers")}</h2>
          <p>
            {t(
              "ai.subtitle",
              "Generate multilingual BUY, SELL, or HOLD guidance with confidence, drivers, trend logic, and mobile-safe explainability."
            )}
          </p>
        </div>
        <div className="ai-header-chip">
          <Globe2 size={16} />
          <span>{currentLanguage.label}</span>
        </div>
      </div>

      <div className="ai-insights-layout">
        <div className="glass-card ai-input-card">
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="field">
              <span>{t("ai.product", "Product")}</span>
              <select name="productName" value={form.productName} onChange={handleChange} required>
                {productList.map((product) => (
                  <option key={product} value={product}>
                    {product}
                  </option>
                ))}
              </select>
            </label>

            <div className="field-row">
              <label className="field">
                <span>{t("ai.quantity", "Quantity (kg)")}</span>
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="field">
                <span>{t("ai.farmerPrice", "Farmer Price (Rs./kg)")}</span>
                <input
                  name="farmerPrice"
                  type="number"
                  min="1"
                  value={form.farmerPrice}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <label className="field">
              <span>{t("ai.currentStage", "Current Stage")}</span>
              <select name="stageIndex" value={form.stageIndex} onChange={handleChange}>
                {stages.map((stage, index) => (
                  <option key={stage} value={index}>
                    {stage}
                  </option>
                ))}
              </select>
            </label>

            <div className="glass-card ai-data-signal-card">
              <strong>Recent signal base</strong>
              <p>{transactions.length} recent transaction events available for scoring.</p>
            </div>

            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? t("ai.analyzing", "Analyzing...") : t("ai.run", "Run AI Analysis")}
            </button>
          </form>
        </div>

        <div className="side-stack ai-results-stack">
          {!result ? (
            <div className="glass-card empty-state-card">
              <EmptyState
                icon={Bot}
                title={t("ai.emptyTitle", "No recommendation yet")}
                description={t(
                  "ai.emptyDescription",
                  "Select a crop, quantity, and current stage to generate explainable farmer guidance."
                )}
              />
            </div>
          ) : result.insufficientData ? (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="ai-explainable-grid">
              <motion.div variants={itemVariants} className="glass-card ai-warning-panel insufficient">
                <div className="ai-warning-top">
                  <ShieldAlert size={18} />
                  <strong>Insufficient Data</strong>
                </div>
                <p>{result.insufficientDataReason}</p>
                <p>{result.confidenceNarrative}</p>
                <div className="ai-warning-metrics">
                  <div className="ai-warning-metric">
                    <span>{t("ai.confidence", "Confidence")}</span>
                    <strong>{result.confidence}%</strong>
                  </div>
                  <div className="ai-warning-metric">
                    <span>Recent Tx Input</span>
                    <strong>{result.recentTransactionCount}</strong>
                  </div>
                </div>
                <div className="ai-voice-actions">
                  <button type="button" className="button button-secondary" onClick={handleListen}>
                    <Mic size={16} />
                    {t("ai.listen", "Listen in my language")}
                  </button>
                  <button type="button" className="button button-secondary" onClick={handleStopAudio} disabled={!isSpeaking}>
                    <Square size={14} />
                    {t("ai.stop", "Stop audio")}
                  </button>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="glass-card ai-explanation-card">
                <div className="section-heading">
                  <h3>Fallback reasoning</h3>
                  <p>The engine chooses neutrality rather than pretending confidence it does not have.</p>
                </div>
                <div className="ai-reason-list">
                  {result.reasoningBullets.map((reason, index) => (
                    <div key={`${reason}-${index}`} className="ai-reason-item">
                      <span>{index + 1}</span>
                      <p>{reason}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="ai-explainable-grid">
              <motion.div variants={itemVariants} className="glass-card ai-recommendation-panel">
                <div className="ai-recommendation-top">
                  <div>
                    <div className="eyebrow">{t("ai.recommendation", "Recommendation")}</div>
                    <h3>{recommendationLabel}</h3>
                    <p>{result.whyRecommendation}</p>
                  </div>
                  <div className={`ai-recommendation-badge ${result.recommendation.toLowerCase()}`}>
                    <strong>{result.confidence}%</strong>
                    <span>{t("ai.confidence", "Confidence")}</span>
                  </div>
                </div>

                {result.lowConfidence ? (
                  <div className="ai-warning-panel">
                    <div className="ai-warning-top">
                      <AlertTriangle size={18} />
                      <strong>Low confidence warning</strong>
                    </div>
                    <p>{result.confidenceNarrative}</p>
                  </div>
                ) : null}

                <div className="ai-movement-grid">
                  <div className="ai-movement-card">
                    <span>{t("ai.next24h", "Next 24h")}</span>
                    <strong>{result.movement.next24h.percent}%</strong>
                    <p>{result.movement.next24h.explanation}</p>
                  </div>
                  <div className="ai-movement-card">
                    <span>{t("ai.next7d", "Next 7d")}</span>
                    <strong>{result.movement.next7d.percent}%</strong>
                    <p>{result.movement.next7d.explanation}</p>
                  </div>
                </div>

                <div className="ai-voice-actions">
                  <button type="button" className="button button-secondary" onClick={handleListen}>
                    <Mic size={16} />
                    {t("ai.listen", "Listen in my language")}
                  </button>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={handleStopAudio}
                    disabled={!isSpeaking}
                  >
                    <Square size={14} />
                    {t("ai.stop", "Stop audio")}
                  </button>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="glass-card ai-explanation-card">
                <div className="section-heading">
                  <h3>{t("ai.drivers", "Reasoning drivers")}</h3>
                  <p>{t("ai.why", "Why this recommendation was made")}</p>
                </div>
                <div className="ai-reason-list">
                  {result.reasoningBullets.map((reason, index) => (
                    <div key={`${reason}-${index}`} className="ai-reason-item">
                      <span>{index + 1}</span>
                      <p>{reason}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="glass-card ai-factor-card">
                <div className="section-heading">
                  <h3>{t("ai.factors", "Factor importance")}</h3>
                  <p>{t("ai.chartDescription", "Live weighted signals behind the recommendation.")}</p>
                </div>
                <div className="ai-factor-chart-shell">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.factors} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                      <CartesianGrid horizontal={false} stroke="rgba(148, 163, 184, 0.18)" />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis
                        type="category"
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        width={120}
                        tick={{ fill: "rgb(100 116 139)", fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
                        contentStyle={{
                          borderRadius: "16px",
                          border: "1px solid rgba(226, 232, 240, 0.9)",
                          background: "rgba(255,255,255,0.98)",
                        }}
                        formatter={(value) => [`${value}/100`, "Signal"]}
                      />
                      <Bar dataKey="value" fill="#10b981" radius={[10, 10, 10, 10]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="ai-factor-detail-grid">
                  {result.factors.map((factor) => (
                    <div key={factor.label} className="ai-factor-detail">
                      <div className="ai-factor-detail-top">
                        <strong>{factor.label}</strong>
                        <span>{factor.value}/100</span>
                      </div>
                      <p>{factor.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="glass-card ai-trend-card">
                <div className="section-heading">
                  <h3>{t("ai.trend", "Historical trend explanation")}</h3>
                  <p>{result.trendExplanation}</p>
                </div>
                <div className="ai-stage-table">
                  {result.stageBreakdown.map((row) => (
                    <div key={row.stage} className={`ai-stage-row${row.isCurrent ? " current" : ""}`}>
                      <span className="ai-stage-name">
                        {row.isCurrent ? <ArrowRight size={12} /> : null}
                        {row.stage}
                      </span>
                      <strong>{formatCurrency(row.price)}</strong>
                      {row.markup > 0 ? <span className="ai-stage-markup">+{row.markup}%</span> : null}
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="glass-card ai-summary-strip">
                <div className="summary-chip">
                  <CheckCircle2 size={16} />
                  <span>{result.fairnessMessage}</span>
                </div>
                <div className="ai-summary-strip-grid">
                  <div className="ai-summary-stat">
                    <span>Current</span>
                    <strong>{formatCurrency(result.currentPrice)}</strong>
                  </div>
                  <div className="ai-summary-stat">
                    <span>Farmer Share</span>
                    <strong>{result.farmerShare}%</strong>
                  </div>
                  <div className="ai-summary-stat">
                    <span>Signal Quality</span>
                    <strong>{result.signalQuality}%</strong>
                  </div>
                  <div className="ai-summary-stat">
                    <span>Recent Tx Input</span>
                    <strong>{result.recentTransactionCount}</strong>
                  </div>
                  <div className="ai-summary-stat">
                    <span>{t("ai.currentRevenue", "Revenue at current stage")}</span>
                    <strong>{formatCurrency(result.estimatedRevenue)}</strong>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
