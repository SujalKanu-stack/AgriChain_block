import React, { useMemo } from "react";
import { motion } from "framer-motion";

import { EmptyState } from "../EmptyState";
import { LoadingGrid, LoadingTimeline } from "../Loading";
import LoadingState from "../LoadingState";
import { useSupplyChainData } from "../../hooks/useSupplyChainData";
import DashboardAreaChartCard from "./DashboardAreaChartCard";
import DashboardKpiGrid from "./DashboardKpiGrid";
import DashboardTimelineCard from "./DashboardTimelineCard";
import DashboardWidgetCard from "./DashboardWidgetCard";

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

export default function RoleDashboardPage({
  eyebrow,
  title,
  description,
  accent,
  buildData,
}) {
  const { products, transactions, loading } = useSupplyChainData();

  const pageData = useMemo(
    () => buildData({ products, transactions }),
    [buildData, products, transactions]
  );

  return (
    <section className="page-section role-dashboard-page">
      {loading ? (
        <div className="role-dashboard-grid">
          <LoadingState message={`Loading ${title.toLowerCase()}...`} detail="Preparing role-specific metrics and activity." />
          <LoadingGrid cards={3} className="role-kpi-grid" />
          <div className="role-dashboard-layout">
            <LoadingTimeline items={1} />
            <LoadingGrid cards={2} />
          </div>
        </div>
      ) : pageData.kpis.every((item) => Number(item.value || 0) === 0) ? (
        <div className="glass-card empty-state-card">
          <EmptyState
            title={`No ${title.toLowerCase()} data yet`}
            description="This role dashboard will populate automatically as batches move through the supply chain."
          />
        </div>
      ) : (
        <motion.div className="role-dashboard-grid" variants={containerVariants} initial="hidden" animate="show">
          <motion.div variants={itemVariants} className="role-dashboard-hero glass-card">
            <div>
              <div className="eyebrow">{eyebrow}</div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
            <div className="role-dashboard-accent" style={{ "--role-accent": accent }}>
              <span>{pageData.heroPill}</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <DashboardKpiGrid items={pageData.kpis} />
          </motion.div>

          <motion.div variants={itemVariants} className="role-dashboard-layout">
            <DashboardAreaChartCard
              title={pageData.chart.title}
              description={pageData.chart.description}
              data={pageData.chart.data}
              dataKey={pageData.chart.dataKey}
              color={accent}
              valueFormatter={pageData.chart.valueFormatter}
            />
            <div className="role-dashboard-side">
              {pageData.widgets.map((widget) => (
                <DashboardWidgetCard key={widget.title} {...widget} />
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <DashboardTimelineCard
              title={pageData.timeline.title}
              description={pageData.timeline.description}
              items={pageData.timeline.items}
            />
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
