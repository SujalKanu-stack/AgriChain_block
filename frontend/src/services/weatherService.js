import {
  createErrorState,
  createLoadingState,
  createSuccessState,
  resolveServiceMode,
  safeLiveRequest,
} from "./serviceHelpers";

const LIVE_URL = process.env.REACT_APP_WEATHER_API_URL || "";
const LIVE_KEY = process.env.REACT_APP_WEATHER_API_KEY || "";

export function createInitialWeatherState() {
  return createLoadingState("mock", "idle");
}

function buildMockWeather(location = "Unknown", cropType = "general") {
  const seed = String(location + cropType)
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  const temperature = 24 + (seed % 9);
  const humidity = 48 + (seed % 30);
  const rainChance = 12 + (seed % 55);
  const windSpeed = 6 + (seed % 12);
  const condition = rainChance > 55 ? "Rain risk" : humidity > 70 ? "Humid" : "Stable";
  const riskLevel = rainChance > 60 ? "high" : rainChance > 35 ? "medium" : "low";

  return {
    location,
    cropType,
    temperature,
    humidity,
    rainChance,
    windSpeed,
    condition,
    riskLevel,
    advisory:
      riskLevel === "high"
        ? "Weather risk is elevated. Monitor transport and storage conditions closely."
        : riskLevel === "medium"
          ? "Moderate weather pressure. Use this as one input, not a certainty."
          : "Weather conditions look relatively stable for near-term planning.",
    updatedAt: new Date().toISOString(),
  };
}

function normalizeLiveWeather(payload, location, cropType) {
  const current = payload?.current || payload?.data || payload || {};

  return {
    location,
    cropType,
    temperature: Number(current?.temp_c ?? current?.temperature ?? 0),
    humidity: Number(current?.humidity ?? 0),
    rainChance: Number(current?.precip_probability ?? current?.rainChance ?? 0),
    windSpeed: Number(current?.wind_kph ?? current?.windSpeed ?? 0),
    condition: current?.condition?.text || current?.summary || "Live weather",
    riskLevel:
      Number(current?.precip_probability ?? current?.rainChance ?? 0) > 60
        ? "high"
        : Number(current?.precip_probability ?? current?.rainChance ?? 0) > 35
          ? "medium"
          : "low",
    advisory: current?.advisory || "Live weather data loaded successfully.",
    updatedAt: new Date().toISOString(),
  };
}

export async function getWeatherInsight({ location, cropType = "general", mode = "auto" }) {
  const resolvedMode = resolveServiceMode(mode, Boolean(LIVE_URL));

  if (resolvedMode === "live") {
    try {
      const liveData = await safeLiveRequest({
        url: LIVE_URL,
        params: {
          q: location,
          crop: cropType,
          key: LIVE_KEY || undefined,
        },
      });

      return createSuccessState(normalizeLiveWeather(liveData, location, cropType), {
        mode: "live",
        source: "live-api",
        message: "Weather insight loaded from live API.",
      });
    } catch (error) {
      return createErrorState(error, {
        data: buildMockWeather(location, cropType),
        mode: "mock",
        source: "mock-fallback",
        isFallback: true,
        message: "Live weather API failed. Mock weather insight returned.",
      });
    }
  }

  return createSuccessState(buildMockWeather(location, cropType), {
    mode: "mock",
    source: "mock-service",
    message: "Mock weather insight returned.",
  });
}
