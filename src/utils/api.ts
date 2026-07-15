/**
 * Unified API handler for Cursor Animator Studio
 * Validates API keys client-side and manages AI request execution.
 * Triggers a global event when API key issues or failures are detected.
 */

export const isKeyPlaceholder = (key?: any): boolean => {
  if (!key || typeof key !== "string") return true;
  const k = key.trim().toUpperCase();
  return (
    k === "" ||
    k === "NULL" ||
    k === "UNDEFINED" ||
    k.includes("YOUR_") ||
    k.includes("MY_") ||
    k.includes("PLACEHOLDER") ||
    k.includes("DUMMY") ||
    k.includes("API_KEY") ||
    k.length < 15
  );
};

export interface AiRequestOptions {
  message: string;
  history: { role: "user" | "model"; text: string }[];
  model: string;
  apiKey?: string;
}

/**
 * Dispatch a custom event to notify App.tsx (the global error notification system)
 */
export const dispatchApiKeyError = (message: string, isWarning: boolean = false) => {
  const event = new CustomEvent("api-key-error", {
    detail: { message, isWarning, timestamp: Date.now() },
  });
  window.dispatchEvent(event);
};

/**
 * Send an AI request via our Express proxy, checking API keys before sending.
 */
export const sendAiRequest = async (options: AiRequestOptions) => {
  const { message, history, model, apiKey } = options;

  // 1. Client-Side Pre-validation
  if (apiKey && isKeyPlaceholder(apiKey)) {
    const errMsg = "Aapne ek default placeholder API Key enter kiya hai! Please settings panel me jaakar active working key configure karein.";
    dispatchApiKeyError(errMsg);
    throw new Error(errMsg);
  }

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) {
      headers["x-custom-api-key"] = apiKey;
    }

    const res = await fetch("/api/ai-guide", {
      method: "POST",
      headers,
      body: JSON.stringify({ message, history, model }),
    });

    const data = await res.json();

    if (!res.ok) {
      const serverErr = data.error || "Failed to connect to the server.";
      dispatchApiKeyError(serverErr);
      throw new Error(serverErr);
    }

    // Check if the backend flagged the key as invalid in its JSON payload
    if (data.valid === false || data.error) {
      const errText = data.error || "API key error flagged by backend.";
      dispatchApiKeyError(errText);
      throw new Error(errText);
    }

    return data;
  } catch (err: any) {
    console.error("sendAiRequest error caught:", err);
    const msg = err.message || "Failed to make request.";
    // If the error message indicates key/auth/token failure, trigger notification
    const msgLower = msg.toLowerCase();
    if (
      msgLower.includes("key") || 
      msgLower.includes("api_key") || 
      msgLower.includes("unauthorized") || 
      msgLower.includes("forbidden") || 
      msgLower.includes("invalid") ||
      msgLower.includes("placeholder")
    ) {
      dispatchApiKeyError(msg);
    }
    throw err;
  }
};

/**
 * Validate an API key on the backend
 */
export const testApiKey = async (apiKey: string, model: string) => {
  if (isKeyPlaceholder(apiKey)) {
    const errMsg = "Yeh ek generic placeholder API Key hai! Please ek valid working API key enter karein.";
    dispatchApiKeyError(errMsg);
    return { valid: false, error: errMsg };
  }

  try {
    const res = await fetch("/api/test-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, model }),
    });

    const data = await res.json();

    if (!res.ok) {
      const serverErr = data.error || `HTTP error ${res.status}`;
      dispatchApiKeyError(serverErr);
      return { valid: false, error: serverErr };
    }

    if (!data.valid) {
      dispatchApiKeyError(data.error || "The provided API Key failed server validation check.");
    }

    return data;
  } catch (err: any) {
    const errMsg = err.message || "Failed to establish test request.";
    dispatchApiKeyError(errMsg);
    return { valid: false, error: errMsg };
  }
};
