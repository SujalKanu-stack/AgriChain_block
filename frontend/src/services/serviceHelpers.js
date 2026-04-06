import axios from "axios";

export function createServiceState({
  data = null,
  isLoading = false,
  error = null,
  mode = "mock",
  source = "mock",
  isFallback = false,
  message = "",
} = {}) {
  return {
    data,
    isLoading,
    error,
    mode,
    source,
    isFallback,
    message,
  };
}

export function createLoadingState(mode = "mock", source = "loading") {
  return createServiceState({
    isLoading: true,
    mode,
    source,
    message: "Loading...",
  });
}

export function createSuccessState(data, options = {}) {
  return createServiceState({
    data,
    isLoading: false,
    error: null,
    mode: options.mode || "mock",
    source: options.source || options.mode || "mock",
    isFallback: Boolean(options.isFallback),
    message: options.message || "",
  });
}

export function createErrorState(error, options = {}) {
  return createServiceState({
    data: options.data ?? null,
    isLoading: false,
    error: error?.message || String(error || "Unknown error"),
    mode: options.mode || "mock",
    source: options.source || "error",
    isFallback: Boolean(options.isFallback),
    message: options.message || "",
  });
}

export function resolveServiceMode(mode = "auto", isLiveConfigured = false) {
  if (mode === "live") {
    return "live";
  }

  if (mode === "mock") {
    return "mock";
  }

  return isLiveConfigured ? "live" : "mock";
}

export async function safeLiveRequest({ url, method = "get", params, data, headers, timeout = 10000 }) {
  const response = await axios({
    url,
    method,
    params,
    data,
    headers,
    timeout,
  });

  return response.data;
}
