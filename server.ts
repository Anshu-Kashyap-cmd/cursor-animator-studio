import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const isKeyPlaceholder = (key?: any): boolean => {
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

const formatGeminiError = (error: any): string => {
  let msg = error?.message || "";
  if (typeof msg !== "string") {
    try {
      msg = JSON.stringify(error);
    } catch {
      msg = "Unknown API error";
    }
  }

  // Extract human-readable message from JSON-stringified error if present
  if (msg.includes("{") && msg.includes("}")) {
    try {
      const start = msg.indexOf("{");
      const end = msg.lastIndexOf("}") + 1;
      const jsonStr = msg.substring(start, end);
      const parsed = JSON.parse(jsonStr);
      if (parsed?.error?.message) {
        msg = parsed.error.message;
      } else if (parsed?.message) {
        msg = parsed.message;
      }
    } catch (e) {
      // Keep original message if parsing fails
    }
  }

  const lower = msg.toLowerCase();
  if (lower.includes("api key not valid") || lower.includes("api_key_invalid") || lower.includes("invalid api key")) {
    return "⚠️ Aapki custom Gemini API Key invalid hai. Please screen ke Settings (⚙️) panel me jaakar sahi/working API key type karein ya save karein.";
  }
  if (lower.includes("quota exceeded") || lower.includes("429") || lower.includes("rate limit") || lower.includes("exhausted")) {
    return "⚠️ API Rate Limit: Is key ka free tier quota exhaust ho gaya hai. Please thodi der baad check karein ya alternative working key set karein.";
  }

  return `⚠️ Gemini API Error: ${msg}`;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper: Call Groq Chat Completions API
  const callGroq = async (
    apiKey: string,
    model: string,
    message: string,
    history: any[],
    systemInstruction: string
  ) => {
    const modelMap: Record<string, string> = {
      "llama-3.1-8b": "llama-3.1-8b-instant",
      "llama-3.3-70b": "llama-3.3-70b-versatile",
      "mixtral-8x7b": "mixtral-8x7b-32768",
      "gemma2-9b": "gemma2-9b-it"
    };
    const groqModel = modelMap[model] || model || "llama-3.1-8b-instant";

    const messages = [
      { role: "system", content: systemInstruction },
    ];

    if (history && Array.isArray(history)) {
      for (const turn of history) {
        messages.push({
          role: turn.role === "user" ? "user" : "assistant",
          content: turn.text
        });
      }
    }

    messages.push({
      role: "user",
      content: message
    });

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: groqModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "No response received from Groq.";
    return { text, sources: [] };
  };

  // Helper: Test Groq API Key validity
  const testGroqKey = async (apiKey: string, model: string) => {
    const modelMap: Record<string, string> = {
      "llama-3.1-8b": "llama-3.1-8b-instant",
      "llama-3.3-70b": "llama-3.3-70b-versatile",
      "mixtral-8x7b": "mixtral-8x7b-32768",
      "gemma2-9b": "gemma2-9b-it"
    };
    const targetModel = modelMap[model] || "llama-3.1-8b-instant";
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 10
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    return { valid: true, text: text.trim() };
  };

  // Helper: Call OpenRouter Chat Completions API
  const callOpenRouter = async (
    apiKey: string,
    model: string,
    message: string,
    history: any[],
    systemInstruction: string
  ) => {
    const modelMap: Record<string, string> = {
      "llama-3.1-8b": "meta-llama/llama-3.1-8b-instruct",
      "llama-3.3-70b": "meta-llama/llama-3.3-70b-instruct",
      "mixtral-8x7b": "mistralai/mixtral-8x7b-instruct",
      "gemma2-9b": "google/gemma-2-9b-it",
      "gemini-2.5-flash": "google/gemini-2.5-flash",
      "gemini-2.5-pro": "google/gemini-2.5-pro"
    };
    const openRouterModel = modelMap[model] || model || "google/gemini-2.5-flash";

    const messages = [
      { role: "system", content: systemInstruction },
    ];

    if (history && Array.isArray(history)) {
      for (const turn of history) {
        messages.push({
          role: turn.role === "user" ? "user" : "assistant",
          content: turn.text
        });
      }
    }

    messages.push({
      role: "user",
      content: message
    });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://ai.studio/build",
        "X-Title": "Cursor Animator Studio"
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "No response received from OpenRouter.";
    return { text, sources: [] };
  };

  // Helper: Test OpenRouter API Key validity
  const testOpenRouterKey = async (apiKey: string, model: string) => {
    const modelMap: Record<string, string> = {
      "llama-3.1-8b": "meta-llama/llama-3.1-8b-instruct",
      "llama-3.3-70b": "meta-llama/llama-3.3-70b-instruct",
      "mixtral-8x7b": "mistralai/mixtral-8x7b-instruct",
      "gemma2-9b": "google/gemma-2-9b-it",
      "gemini-2.5-flash": "google/gemini-2.5-flash",
      "gemini-2.5-pro": "google/gemini-2.5-pro"
    };
    const targetModel = modelMap[model] || "google/gemini-2.5-flash";
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://ai.studio/build",
        "X-Title": "Cursor Animator Studio"
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 10
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    return { valid: true, text: text.trim() };
  };

  // API Route: Test API Key validity
  app.post("/api/test-key", async (req, res) => {
    try {
      const { apiKey, model } = req.body;
      if (!apiKey || isKeyPlaceholder(apiKey)) {
        return res.json({ valid: false, error: "Yeh ek default placeholder ya invalid/empty key hai! Please enter a valid active API Key." });
      }

      // Check strictly by prefix: Groq keys start with gsk_, OpenRouter with sk-or-
      const isGroq = apiKey.startsWith("gsk_");
      const isOpenRouter = apiKey.startsWith("sk-or-");

      if (isGroq) {
        const result = await testGroqKey(apiKey, model);
        return res.json(result);
      }

      if (isOpenRouter) {
        const result = await testOpenRouterKey(apiKey, model);
        return res.json(result);
      }

      const ai = new GoogleGenAI({ apiKey });
      const targetModel = model === "llm7" || model?.includes("llama") || model?.includes("mixtral") || model?.includes("gemma")
        ? "gemini-2.5-flash"
        : (model || "gemini-2.5-flash");

      // Attempt a minimal content generation call to check key validity
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: "Hello",
      });

      if (response && response.text) {
        return res.json({ valid: true, text: response.text.trim() });
      } else {
        return res.json({ valid: false, error: "Empty response from Gemini models." });
      }
    } catch (error: any) {
      console.error("Test API Key Error:", error);
      const errMsg = formatGeminiError(error);
      res.json({ valid: false, error: errMsg });
    }
  });

  // Helper: Call Gemini Chat Completions with Search Grounding
  const callGemini = async (
    apiKey: string,
    targetModel: string,
    message: string,
    history: any[],
    systemInstruction: string
  ) => {
    const ai = new GoogleGenAI({ apiKey });
    const actualModel = targetModel === "llm7" || targetModel?.includes("llama") || targetModel?.includes("mixtral") || targetModel?.includes("gemma")
      ? "gemini-2.5-flash"
      : (targetModel || "gemini-2.5-flash");

    const contents: any[] = [
      { 
        role: "user", 
        parts: [{ text: systemInstruction + "\nAlways search the web using your Google Search tool if the user asks about cursor installation, troubleshooting, custom mouse styles, or recent trends, so your instructions are accurate and up-to-date." }] 
      },
      { 
        role: "model", 
        parts: [{ text: "Understood. I will help the user with their custom mouse cursor inquiries and search the web using Google Search when needed to ensure accurate installation instructions." }] 
      }
    ];

    if (history && Array.isArray(history)) {
      for (const turn of history) {
        contents.push({
          role: turn.role === "user" ? "user" : "model",
          parts: [{ text: turn.text }]
        });
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message || "Hello! What can you help me with?" }]
    });

    const response = await ai.models.generateContent({
      model: actualModel,
      contents: contents,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = searchChunks?.map((chunk: any) => ({
      title: chunk.web?.title || "Search Result",
      uri: chunk.web?.uri || ""
    })).filter((s: any) => s.uri) || [];

    const uniqueSources = Array.from(new Map(sources.map((item: any) => [item.uri, item])).values());

    return {
      text: response.text || "I'm sorry, I couldn't generate a response.",
      sources: uniqueSources
    };
  };

  // API Route: AI Guide helper with Google Search Grounding & Groq support
  app.post("/api/ai-guide", async (req, res) => {
    const { message, history, model } = req.body;
    const customKey = req.headers["x-custom-api-key"] as string;

    const systemInstruction = `You are the Cursor Animator Studio AI Guide. 
You help users design mouse cursors, explain the .cur and .ani formats, and provide clear step-by-step instructions on how to install .ani/ .cur custom mouse pointers in Windows (such as through Personalization settings or using PowerShell scripts).
Provide concise, helpful, and friendly answers. Include markdown lists where appropriate.`;

    const rawGeminiKey = process.env.GEMINI_API_KEY;
    const isGeminiKeyValid = rawGeminiKey && !isKeyPlaceholder(rawGeminiKey);
    
    const rawGroqKey = process.env.GROQ_API_KEY || "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";
    const isGroqKeyValid = rawGroqKey && !isKeyPlaceholder(rawGroqKey);

    const activeCustomKey = (customKey && !isKeyPlaceholder(customKey)) ? customKey.trim() : null;

    const isCustomKeyGroq = activeCustomKey && activeCustomKey.startsWith("gsk_");
    const isCustomKeyOpenRouter = activeCustomKey && activeCustomKey.startsWith("sk-or-");
    const isCustomKeyGemini = activeCustomKey && !isCustomKeyGroq && !isCustomKeyOpenRouter;

    const isRequestedModelGroq = model?.includes("llama") || model?.includes("mixtral") || model?.includes("gemma");

    // Case 0: User provided an OpenRouter key
    if (isCustomKeyOpenRouter) {
      try {
        const result = await callOpenRouter(activeCustomKey!, model, message, history, systemInstruction);
        return res.json(result);
      } catch (err: any) {
        console.error("OpenRouter call failed:", err);
        return res.status(200).json({
          text: `⚠️ OpenRouter API Error: ${err.message || "Invalid Key or Connection issue"}. Please verify your OpenRouter API Key in settings (⚙️).`,
          sources: []
        });
      }
    }

    // Case 1: User requested a Groq model
    if (isRequestedModelGroq) {
      if (isCustomKeyGroq) {
        // Use custom Groq key
        try {
          const result = await callGroq(activeCustomKey!, model, message, history, systemInstruction);
          return res.json(result);
        } catch (err: any) {
          console.error("Direct Groq call with custom key failed, trying Gemini fallback:", err);
          if (isGeminiKeyValid) {
            try {
              const result = await callGemini(rawGeminiKey!, "gemini-2.5-flash", message, history, systemInstruction);
              result.text = `${result.text}\n\n*(Note: Groq model error ke karan temporary built-in Gemini active kiya gaya hai!)*`;
              return res.json(result);
            } catch (fallbackErr) {}
          }
          return res.status(200).json({
            text: `Groq call failed: ${err.message || "Invalid Key"}. Please verify your Groq API Key or switch the active model to Gemini!`,
            sources: []
          });
        }
      } else if (isCustomKeyGemini) {
        // User has a Gemini key but selected a Groq model! Automatically route to Gemini using their custom key!
        try {
          const result = await callGemini(activeCustomKey!, "gemini-2.5-flash", message, history, systemInstruction);
          result.text = `${result.text}\n\n*(Note: Aapki custom Gemini API Key ke sath humne accurate Gemini 2.5 Flash model auto-run kiya hai!)*`;
          return res.json(result);
        } catch (geminiErr: any) {
          return res.status(200).json({
            text: `Gemini call failed with custom key: ${geminiErr.message}. Please check your Gemini API key in settings.`,
            sources: []
          });
        }
      } else {
        // No custom key provided. Use system keys.
        if (isGroqKeyValid) {
          // System Groq key is valid!
          try {
            const result = await callGroq(rawGroqKey!, model, message, history, systemInstruction);
            return res.json(result);
          } catch (err: any) {
            if (isGeminiKeyValid) {
              try {
                const result = await callGemini(rawGeminiKey!, "gemini-2.5-flash", message, history, systemInstruction);
                result.text = `${result.text}\n\n*(Note: System Groq issue ke karan built-in Gemini active kiya gaya hai!)*`;
                return res.json(result);
              } catch (fallbackErr) {}
            }
          }
        }
        
        // Default fallback to built-in system Gemini key
        if (isGeminiKeyValid) {
          try {
            const result = await callGemini(rawGeminiKey!, "gemini-2.5-flash", message, history, systemInstruction);
            result.text = `${result.text}\n\n*(Note: Default free Gemini 2.5 Flash model loaded with Google Search Grounding!)*`;
            return res.json(result);
          } catch (geminiErr: any) {
            console.error("Default Gemini call failed:", geminiErr);
          }
        }

        return res.status(200).json({
          text: "System is in standby. Please enter your custom Gemini or Groq API Key in settings to enable high-speed AI responses!",
          sources: []
        });
      }
    }

    // Case 2: User requested a Gemini model (or default)
    const activeGeminiKey = isCustomKeyGemini ? activeCustomKey : (isGeminiKeyValid ? rawGeminiKey : null);
    if (activeGeminiKey) {
      try {
        const result = await callGemini(activeGeminiKey, model, message, history, systemInstruction);
        return res.json(result);
      } catch (geminiError: any) {
        console.error("Gemini call failed with activeGeminiKey:", geminiError);

        // Save-the-day fallback: If user entered an invalid custom Gemini key, but our system key is valid, try it!
        if (isCustomKeyGemini && isGeminiKeyValid && activeCustomKey !== rawGeminiKey) {
          try {
            console.log("Custom key failed, trying system key fallback...");
            const result = await callGemini(rawGeminiKey!, model, message, history, systemInstruction);
            result.text = `${result.text}\n\n*(Aapki custom Gemini API Key fail ho gayi hai, isliye active connection banaye rakhne ke liye built-in system key se response load kiya hai! Settings ⚙️ me sahi key check karein.)*`;
            return res.json(result);
          } catch (systemErr) {
            console.error("System fallback also failed:", systemErr);
          }
        }

        const activeGroqKey = isCustomKeyGroq ? activeCustomKey : (isGroqKeyValid ? rawGroqKey : null);
        if (activeGroqKey) {
          try {
            const result = await callGroq(activeGroqKey, "llama-3.1-8b-instant", message, history, systemInstruction);
            result.text = `${result.text}\n\n*(Note: Gemini model error ke karan high-speed Groq Llama fallback run kiya gaya hai!)*`;
            return res.json(result);
          } catch (groqError: any) {
            console.error("Fallback Groq failed too:", groqError);
          }
        }

        const cleanMessage = formatGeminiError(geminiError);
        return res.status(200).json({
          text: cleanMessage,
          sources: []
        });
      }
    } else {
      // No Gemini key, try to use custom/system Groq key as ultimate fallback
      const activeGroqKey = isCustomKeyGroq ? activeCustomKey : (isGroqKeyValid ? rawGroqKey : null);
      if (activeGroqKey) {
        try {
          const result = await callGroq(activeGroqKey, "llama-3.1-8b-instant", message, history, systemInstruction);
          result.text = `${result.text}\n\n*(Note: Gemini key is currently not active, using high-speed Groq Llama option!)*`;
          return res.json(result);
        } catch (groqErr) {}
      }
      return res.status(200).json({
        text: "AI System is in standby. No valid Gemini or Groq key found. Please input an API key in settings to activate the assistant!",
        sources: []
      });
    }
  });

  // Serve static assets or mount Vite dev server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
