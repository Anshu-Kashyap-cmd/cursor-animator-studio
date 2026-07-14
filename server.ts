import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Test API Key validity
  app.post("/api/test-key", async (req, res) => {
    try {
      const { apiKey, model } = req.body;
      if (!apiKey) {
        return res.status(400).json({ valid: false, error: "API Key is required." });
      }

      const ai = new GoogleGenAI({ apiKey });
      const targetModel = model === "llm7" ? "gemini-2.5-flash" : (model || "gemini-2.5-flash");

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
      res.json({ valid: false, error: error.message || "Invalid API key or authentication failure." });
    }
  });

  // API Route: AI Guide helper with Google Search Grounding
  app.post("/api/ai-guide", async (req, res) => {
    try {
      const { message, history, model } = req.body;
      const customKey = req.headers["x-custom-api-key"] as string;

      const apiKey = customKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(200).json({
          text: "The Gemini API Key is not configured yet. You can configure it in the Secrets panel in AI Studio, or enter your custom key directly in the Assistant settings above! Once added, I can answer questions and search the web.",
          sources: []
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const targetModel = model || "gemini-2.5-flash";
      
      // If the user specifies 'llm7' or other custom tags, use a robust fallback that is guaranteed to support search grounding, or try to run with targetModel
      let actualModel = targetModel;
      if (targetModel === "llm7") {
        actualModel = "gemini-2.5-flash";
      }

      const systemInstruction = `You are the Cursor Animator Studio AI Guide. 
You help users design mouse cursors, explain the .cur and .ani formats, and provide clear step-by-step instructions on how to install .ani/ .cur custom mouse pointers in Windows (such as through Personalization settings or using PowerShell scripts).
Always search the web using your Google Search tool if the user asks about cursor installation, troubleshooting, custom mouse styles, or recent trends, so your instructions are accurate and up-to-date.
Provide concise, helpful, and friendly answers. Include markdown lists where appropriate.`;

      const contents: any[] = [
        { role: "user", parts: [{ text: systemInstruction }] },
        { role: "model", parts: [{ text: "Understood. I will help the user with their custom mouse cursor inquiries and search the web using Google Search when needed to ensure accurate installation instructions." }] }
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

      // Extract search grounding sources if any
      const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources = searchChunks?.map((chunk: any) => ({
        title: chunk.web?.title || "Search Result",
        uri: chunk.web?.uri || ""
      })).filter((s: any) => s.uri) || [];

      // Deduplicate sources by URI
      const uniqueSources = Array.from(new Map(sources.map((item: any) => [item.uri, item])).values());

      res.json({
        text: response.text || "I'm sorry, I couldn't generate a response.",
        sources: uniqueSources
      });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
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
