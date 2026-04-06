import { BadgeCheck, Bug, CircleDollarSign, PackageOpen, QrCode, Route, ScanSearch, ShieldAlert, Store, Tractor, Truck, Wallet, Wheat } from "lucide-react";

import { stages } from "./supplyChain";

export function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

export function getStageChartData(products = [], valueSelector) {
  return stages.map((stage, index) => {
    const matching = products.filter((product) => (product?.currentStageIndex ?? 0) >= index);
    const values = matching.map((product) => Number(valueSelector(product, index) || 0));
    const total = values.reduce((sum, value) => sum + value, 0);

    return {
      label: stage,
      value: values.length ? Math.round(total / values.length) : 0,
    };
  });
}

export function getTimelineItems(transactions = [], keyword = "") {
  const normalizedKeyword = keyword.toLowerCase();
  const source = normalizedKeyword
    ? transactions.filter((entry) => `${entry.title} ${entry.message}`.toLowerCase().includes(normalizedKeyword))
    : transactions;

  return source.slice(0, 6);
}

export function buildFarmerDashboard({ products, transactions }) {
  const farmerLots = products.filter((product) => product?.stage === "Farmer");
  const harvestStock = farmerLots.reduce((sum, product) => sum + Number(product?.quantity ?? 0), 0);
  const revenue = farmerLots.reduce(
    (sum, product) => sum + Number(product?.farmerPrice ?? 0) * Number(product?.quantity ?? 0),
    0
  );

  return {
    heroPill: `${farmerLots.length} origin lots ready for action`,
    kpis: [
      { label: "Create Batch Ready", value: farmerLots.length, icon: Tractor },
      { label: "Harvest Stock", value: harvestStock, suffix: " kg", icon: Wheat },
      { label: "Farmer Revenue", value: revenue, prefix: "Rs. ", icon: Wallet },
    ],
    chart: {
      title: "Farmer Price Curve",
      description: "Average farmer-side realized value as lots move beyond harvest.",
      data: getStageChartData(products, (product, index) => product?.priceJourney?.[index]?.price),
      dataKey: "value",
      valueFormatter: (value) => `Rs.${value}`,
    },
    widgets: [
      {
        title: "Farmer Actions",
        description: "Quick actions and production-level signals.",
        action: { to: "/create", label: "Create Batch" },
        items: [
          { label: "Harvest stock available", value: `${harvestStock.toLocaleString()} kg`, icon: Wheat },
          { label: "Projected revenue", value: formatCurrency(revenue), icon: CircleDollarSign },
        ],
      },
      {
        title: "Field Readiness",
        description: "How origin-stage lots are positioned for the next handoff.",
        items: [
          { label: "Lots still at origin", value: `${farmerLots.length}`, icon: Tractor },
          { label: "Average farmer price", value: formatCurrency(revenue / Math.max(farmerLots.length || 1, 1)), icon: Wallet },
        ],
      },
    ],
    timeline: {
      title: "Farmer Timeline",
      description: "Recent crop-origin and batch creation events.",
      items: getTimelineItems(transactions, "created"),
    },
  };
}

export function buildDistributorDashboard({ products, transactions }) {
  const shipmentLots = products.filter((product) => ["Processing", "Distributor"].includes(product?.stage));
  const routeStatus = shipmentLots.length
    ? Math.round(
        (shipmentLots.filter((product) => Number(product?.currentPrice ?? 0) >= Number(product?.farmerPrice ?? 0)).length /
          shipmentLots.length) *
          100
      )
    : 0;
  const spoilageRisk = shipmentLots.length
    ? Math.round(
        (shipmentLots.filter((product) => {
          const createdAt = new Date(product?.createdAt || Date.now()).getTime();
          return Date.now() - createdAt > 1000 * 60 * 60 * 24;
        }).length /
          shipmentLots.length) *
          100
      )
    : 0;

  return {
    heroPill: `${shipmentLots.length} active distributor flows`,
    kpis: [
      { label: "Shipments", value: shipmentLots.length, icon: Truck },
      { label: "Route Status", value: routeStatus, suffix: "%", icon: Route },
      { label: "Spoilage Risk", value: spoilageRisk, suffix: "%", icon: Bug },
    ],
    chart: {
      title: "Shipment Value Through Handoffs",
      description: "Average pricing momentum across pre-retail movements.",
      data: getStageChartData(products, (product, index) => product?.priceJourney?.[index]?.price),
      dataKey: "value",
      valueFormatter: (value) => `Rs.${value}`,
    },
    widgets: [
      {
        title: "Shipping Control",
        description: "Distribution-specific operational health.",
        items: [
          { label: "Processing + distributor lots", value: `${shipmentLots.length}`, icon: Truck },
          { label: "Healthy route completion", value: `${routeStatus}%`, icon: Route },
        ],
      },
      {
        title: "Spoilage Signals",
        description: "Aging lots derived from current timestamps and lifecycle position.",
        items: [
          { label: "Spoilage risk", value: `${spoilageRisk}%`, icon: Bug },
          { label: "Monitored shipments", value: `${shipmentLots.length}`, icon: PackageOpen },
        ],
      },
    ],
    timeline: {
      title: "Distributor Timeline",
      description: "Shipment and route status events coming from the live activity feed.",
      items: getTimelineItems(transactions, "updated"),
    },
  };
}

export function buildRetailerDashboard({ products, transactions }) {
  const retailLots = products.filter((product) => product?.stage === "Retail");
  const stock = retailLots.reduce((sum, product) => sum + Number(product?.quantity ?? 0), 0);
  const margin = retailLots.length
    ? Math.round(
        retailLots.reduce(
          (sum, product) => sum + (Number(product?.finalPrice ?? 0) - Number(product?.currentPrice ?? 0)),
          0
        ) / retailLots.length
      )
    : 0;
  const demand = products.length ? Math.round((retailLots.length / products.length) * 100) : 0;

  return {
    heroPill: `${retailLots.length} retail-facing lots in stock`,
    kpis: [
      { label: "Stock", value: stock, suffix: " kg", icon: Store },
      { label: "Margin", value: margin, prefix: "Rs. ", icon: CircleDollarSign },
      { label: "Demand", value: demand, suffix: "%", icon: BadgeCheck },
    ],
    chart: {
      title: "Retail Margin Curve",
      description: "Average downstream pricing seen by stocking teams.",
      data: getStageChartData(products, (product, index) => product?.priceJourney?.[index]?.price),
      dataKey: "value",
      valueFormatter: (value) => `Rs.${value}`,
    },
    widgets: [
      {
        title: "Store Readiness",
        description: "Inventory and margin visibility for the retail edge.",
        items: [
          { label: "Retail stock", value: `${stock.toLocaleString()} kg`, icon: Store },
          { label: "Average remaining margin", value: formatCurrency(margin), icon: CircleDollarSign },
        ],
      },
      {
        title: "Demand Signals",
        description: "Retail load inferred from current stage concentration.",
        items: [
          { label: "Retail demand share", value: `${demand}%`, icon: BadgeCheck },
          { label: "Active store lots", value: `${retailLots.length}`, icon: PackageOpen },
        ],
      },
    ],
    timeline: {
      title: "Retailer Timeline",
      description: "Shelf-ready events and retail-stage movement.",
      items: getTimelineItems(transactions, "retail"),
    },
  };
}

export function buildConsumerDashboard({ products, transactions }) {
  const trustScore = products.length
    ? Math.round(products.reduce((sum, product) => sum + Number(product?.farmerShare ?? 0), 0) / products.length)
    : 0;
  const qrVerifications = products.length;
  const journeyTimeline = products.length
    ? Math.round(
        (products.reduce((sum, product) => sum + Number(product?.currentStageIndex ?? 0), 0) /
          (products.length * (stages.length - 1))) *
          100
      )
    : 0;

  return {
    heroPill: `${products.length} traceable journeys available`,
    kpis: [
      { label: "QR Verify", value: qrVerifications, icon: QrCode },
      { label: "Journey Timeline", value: journeyTimeline, suffix: "%", icon: ScanSearch },
      { label: "Trust Score", value: trustScore, suffix: "%", icon: BadgeCheck },
    ],
    chart: {
      title: "Consumer Trust Curve",
      description: "Traceability confidence across each lifecycle step.",
      data: stages.map((stage, index) => ({
        label: stage,
        value: products.length
          ? Math.round(
              (products.filter((product) => (product?.currentStageIndex ?? 0) >= index).length / products.length) * 100
            )
          : 0,
      })),
      dataKey: "value",
      valueFormatter: (value) => `${value}%`,
    },
    widgets: [
      {
        title: "Verification Hub",
        description: "Consumer-facing transparency metrics.",
        items: [
          { label: "QR verifiable products", value: `${qrVerifications}`, icon: QrCode },
          { label: "Average trust score", value: `${trustScore}%`, icon: BadgeCheck },
        ],
      },
      {
        title: "Journey Confidence",
        description: "How complete the average batch timeline is for consumer review.",
        items: [
          { label: "Journey completion", value: `${journeyTimeline}%`, icon: ScanSearch },
          { label: "Traceable lots", value: `${products.length}`, icon: PackageOpen },
        ],
      },
    ],
    timeline: {
      title: "Consumer Timeline",
      description: "Recent end-user traceability and chain completion events.",
      items: getTimelineItems(transactions, "consumer"),
    },
  };
}

export function buildAdminDashboard({ products, transactions }) {
  const fraudAlerts = products.filter((product) => Number(product?.farmerShare ?? 0) < 30).length;
  const ledgerVolume = transactions.length;

  return {
    heroPill: `${ledgerVolume} ledger events indexed`,
    kpis: [
      { label: "Global Overview", value: products.length, icon: ShieldAlert },
      { label: "Fraud Alerts", value: fraudAlerts, icon: ShieldAlert },
      { label: "Ledger Volume", value: ledgerVolume, icon: Wallet },
    ],
    chart: {
      title: "Global Network Value",
      description: "Average price realization at each stage for admin monitoring.",
      data: getStageChartData(products, (product, index) => product?.priceJourney?.[index]?.price),
      dataKey: "value",
      valueFormatter: (value) => `Rs.${value}`,
    },
    widgets: [
      {
        title: "Governance Signals",
        description: "Top-level oversight metrics from the normalized ledger.",
        items: [
          { label: "Tracked batches", value: `${products.length}`, icon: ShieldAlert },
          { label: "Low-share fraud alerts", value: `${fraudAlerts}`, icon: Bug },
        ],
      },
      {
        title: "Ledger Throughput",
        description: "Operational activity available for admin review.",
        items: [
          { label: "Ledger volume", value: `${ledgerVolume}`, icon: Wallet },
          { label: "Recent events indexed", value: `${transactions.length}`, icon: BadgeCheck },
        ],
      },
    ],
    timeline: {
      title: "Admin Timeline",
      description: "Recent platform-wide operations and ledger events.",
      items: getTimelineItems(transactions),
    },
  };
}
