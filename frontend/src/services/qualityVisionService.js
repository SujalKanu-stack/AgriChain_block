import {
  createErrorState,
  createLoadingState,
  createSuccessState,
  resolveServiceMode,
  safeLiveRequest,
} from "./serviceHelpers";
import { analyzeQualityImage } from "../utils/qualityInspection";

const LIVE_URL = process.env.REACT_APP_VISION_API_URL || "";
const LIVE_KEY = process.env.REACT_APP_VISION_API_KEY || "";

export function createInitialQualityVisionState() {
  return createLoadingState("mock", "idle");
}

function normalizeLiveVisionResult(payload) {
  const data = payload?.data || payload || {};

  return {
    qualityGrade: data?.qualityGrade || data?.grade || "B",
    qualityScore: Number(data?.qualityScore ?? data?.score ?? 0),
    freshnessScore: Number(data?.freshnessScore ?? data?.freshness ?? 0),
    defectDetection: data?.defectDetection || data?.defects || [],
    spoilageLikelihood: Number(data?.spoilageLikelihood ?? data?.spoilage ?? 0),
    recommendation: data?.recommendation || "caution",
    confidence: Number(data?.confidence ?? 0),
    explanation: data?.explanation || "Live vision analysis completed.",
    factorBreakdown: data?.factorBreakdown || [],
    provider: data?.provider || "live-api",
  };
}

export async function inspectQualityImage({ file, mode = "auto" }) {
  const resolvedMode = resolveServiceMode(mode, Boolean(LIVE_URL));

  if (!file) {
    return createErrorState(new Error("Image file is required"), {
      mode: "mock",
      source: "validation",
      message: "Image file is required for inspection.",
    });
  }

  if (resolvedMode === "live") {
    try {
      const formData = new FormData();
      formData.append("image", file);
      if (LIVE_KEY) {
        formData.append("key", LIVE_KEY);
      }

      const liveData = await safeLiveRequest({
        url: LIVE_URL,
        method: "post",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 20000,
      });

      return createSuccessState(normalizeLiveVisionResult(liveData), {
        mode: "live",
        source: "live-api",
        message: "Quality vision result loaded from live API.",
      });
    } catch (error) {
      const mockResult = await analyzeQualityImage(file);
      return createErrorState(error, {
        data: { ...mockResult, provider: "mock-fallback" },
        mode: "mock",
        source: "mock-fallback",
        isFallback: true,
        message: "Live vision API failed. Mock inspection returned.",
      });
    }
  }

  const mockResult = await analyzeQualityImage(file);
  return createSuccessState({ ...mockResult, provider: "mock-service" }, {
    mode: "mock",
    source: "mock-service",
    message: "Mock quality inspection returned.",
  });
}
