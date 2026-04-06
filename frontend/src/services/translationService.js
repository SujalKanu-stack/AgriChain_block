import {
  createErrorState,
  createLoadingState,
  createSuccessState,
  resolveServiceMode,
  safeLiveRequest,
} from "./serviceHelpers";

const LIVE_URL = process.env.REACT_APP_TRANSLATION_API_URL || "";
const LIVE_KEY = process.env.REACT_APP_TRANSLATION_API_KEY || "";

const MOCK_DICTIONARY = {
  hi: {
    safe: "सुरक्षित",
    caution: "सावधानी",
    avoid: "बचें",
    quality: "गुणवत्ता",
    freshness: "ताजगी",
  },
  kn: {
    safe: "ಸುರಕ್ಷಿತ",
    caution: "ಎಚ್ಚರಿಕೆ",
    avoid: "ತಪ್ಪಿಸಿ",
    quality: "ಗುಣಮಟ್ಟ",
    freshness: "ತಾಜಾತನ",
  },
  te: {
    safe: "సురక్షితం",
    caution: "జాగ్రత్త",
    avoid: "తప్పించండి",
    quality: "నాణ్యత",
    freshness: "తాజాదనం",
  },
  ta: {
    safe: "பாதுகாப்பானது",
    caution: "எச்சரிக்கை",
    avoid: "தவிர்க்கவும்",
    quality: "தரம்",
    freshness: "புதுமை",
  },
};

export function createInitialTranslationState() {
  return createLoadingState("mock", "idle");
}

function translateWithMock(text = "", targetLanguage = "en") {
  if (!text) {
    return "";
  }

  if (targetLanguage === "en") {
    return text;
  }

  const dictionary = MOCK_DICTIONARY[targetLanguage] || {};
  return text
    .split(" ")
    .map((word) => dictionary[word.toLowerCase()] || word)
    .join(" ");
}

function normalizeLiveTranslation(payload, text, targetLanguage) {
  return {
    input: text,
    translatedText:
      payload?.translatedText ||
      payload?.data?.translatedText ||
      payload?.data?.translations?.[0]?.translatedText ||
      text,
    targetLanguage,
    provider: payload?.provider || "live-api",
  };
}

export async function translateText({ text, targetLanguage = "en", mode = "auto" }) {
  const resolvedMode = resolveServiceMode(mode, Boolean(LIVE_URL));

  if (resolvedMode === "live") {
    try {
      const liveData = await safeLiveRequest({
        url: LIVE_URL,
        method: "post",
        data: {
          text,
          targetLanguage,
          key: LIVE_KEY || undefined,
        },
      });

      return createSuccessState(normalizeLiveTranslation(liveData, text, targetLanguage), {
        mode: "live",
        source: "live-api",
        message: "Translation loaded from live API.",
      });
    } catch (error) {
      return createErrorState(error, {
        data: {
          input: text,
          translatedText: translateWithMock(text, targetLanguage),
          targetLanguage,
          provider: "mock-fallback",
        },
        mode: "mock",
        source: "mock-fallback",
        isFallback: true,
        message: "Live translation failed. Mock translation returned.",
      });
    }
  }

  return createSuccessState(
    {
      input: text,
      translatedText: translateWithMock(text, targetLanguage),
      targetLanguage,
      provider: "mock-service",
    },
    {
      mode: "mock",
      source: "mock-service",
      message: "Mock translation returned.",
    }
  );
}
