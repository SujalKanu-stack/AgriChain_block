import {
  createErrorState,
  createLoadingState,
  createSuccessState,
  resolveServiceMode,
  safeLiveRequest,
} from "./serviceHelpers";

const LIVE_URL = process.env.REACT_APP_MANDI_API_URL || "";
const LIVE_KEY = process.env.REACT_APP_MANDI_API_KEY || "";

export function createInitialMandiPriceState() {
  return createLoadingState("mock", "idle");
}

function buildMockMandiPrice(productName = "Tomato", market = "Bengaluru") {
  const seed = String(productName + market)
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  const modalPrice = 18 + (seed % 45);
  const minPrice = Math.max(8, modalPrice - (seed % 7));
  const maxPrice = modalPrice + 8 + (seed % 9);
  const demandSpike = 35 + (seed % 45);
  const trend = demandSpike > 65 ? "up" : demandSpike < 45 ? "stable" : "watch";

  return {
    productName,
    market,
    modalPrice,
    minPrice,
    maxPrice,
    demandSpike,
    trend,
    recommendationContext:
      trend === "up"
        ? "Mandi pricing suggests a stronger selling window."
        : trend === "watch"
          ? "Prices are moving, but not enough to assume a strong spike."
          : "Mandi pricing looks steady rather than sharply directional.",
    updatedAt: new Date().toISOString(),
  };
}

function normalizeLiveMandiPrice(payload, productName, market) {
  const row = payload?.records?.[0] || payload?.data?.[0] || payload || {};

  return {
    productName,
    market: row?.market || market,
    modalPrice: Number(row?.modal_price ?? row?.modalPrice ?? 0),
    minPrice: Number(row?.min_price ?? row?.minPrice ?? 0),
    maxPrice: Number(row?.max_price ?? row?.maxPrice ?? 0),
    demandSpike: Number(row?.demand_spike ?? row?.demandSpike ?? 50),
    trend: row?.trend || "stable",
    recommendationContext: row?.commentary || "Live mandi data loaded successfully.",
    updatedAt: new Date().toISOString(),
  };
}

export async function getMandiPriceInsight({ productName, market = "Bengaluru", mode = "auto" }) {
  const resolvedMode = resolveServiceMode(mode, Boolean(LIVE_URL));

  if (resolvedMode === "live") {
    try {
      const liveData = await safeLiveRequest({
        url: LIVE_URL,
        params: {
          commodity: productName,
          market,
          key: LIVE_KEY || undefined,
        },
      });

      return createSuccessState(normalizeLiveMandiPrice(liveData, productName, market), {
        mode: "live",
        source: "live-api",
        message: "Mandi price insight loaded from live API.",
      });
    } catch (error) {
      return createErrorState(error, {
        data: buildMockMandiPrice(productName, market),
        mode: "mock",
        source: "mock-fallback",
        isFallback: true,
        message: "Live mandi price API failed. Mock pricing returned.",
      });
    }
  }

  return createSuccessState(buildMockMandiPrice(productName, market), {
    mode: "mock",
    source: "mock-service",
    message: "Mock mandi pricing returned.",
  });
}
