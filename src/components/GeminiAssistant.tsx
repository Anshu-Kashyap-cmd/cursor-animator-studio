import React, { useState, useRef, useEffect } from "react";
import { 
  MessageSquareCode, 
  Send, 
  Sparkles, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  Key,
  ShieldCheck
} from "lucide-react";
import { GlassPanel } from "./GlassPanel.tsx";

interface Message {
  role: "user" | "model";
  text: string;
  sources?: Array<{ title: string; uri: string }>;
}

export const GeminiAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Hello! I am your Cursor Animator Studio AI Guide. I have access to Google Search, so I can give you up-to-date answers on Windows cursor schemas, custom cursor installation issues, effect inspirations, and more! How can I help you today?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Custom API Key & Model Configuration States
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem("custom_gemini_api_key") || "Vs4W8vQIvZcNBztQQ0kA546e9O+bA2fdIVb6w4YPBjamXo6x+SbV2OhrDV0LxzEXY2q8iCnV3G1QuujuDDYrd2ptIqmmw9ldphK8Ez2WUE6ZO9fu9as6rJB19i4GKph0l22D7wO0SBolJ+/MxPQ=";
  });
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem("custom_gemini_model") || "gemini-2.5-flash";
  });
  const [showKey, setShowKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testStatus, setTestStatus] = useState<{ valid: boolean; error?: string; response?: string } | null>(null);

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem("custom_gemini_api_key", apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem("custom_gemini_model", selectedModel);
  }, [selectedModel]);

  const handleTestKey = async () => {
    setIsTestingKey(true);
    setTestStatus(null);
    try {
      const res = await fetch("/api/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, model: selectedModel }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      if (data.valid) {
        setTestStatus({ valid: true, response: data.text });
      } else {
        setTestStatus({ valid: false, error: data.error || "Unknown validation error" });
      }
    } catch (err: any) {
      console.error(err);
      setTestStatus({ valid: false, error: err.message || "Failed to make test request" });
    } finally {
      setIsTestingKey(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue("");
    setIsLoading(true);

    const updatedMessages = [...messages, { role: "user" as const, text: userText }];
    setMessages(updatedMessages);

    try {
      // Build a conversation history of last 5 turns
      const history = updatedMessages
        .slice(-6, -1) // Exclude the newly added user message itself from history
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) {
        headers["x-custom-api-key"] = apiKey;
      }

      const res = await fetch("/api/ai-guide", {
        method: "POST",
        headers,
        body: JSON.stringify({ message: userText, history, model: selectedModel }),
      });

      if (!res.ok) {
        throw new Error("Failed to consult the AI Guide.");
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: data.text,
          sources: data.sources,
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "I encountered a slight issue connecting to Google Search. Please verify that your Gemini API key is configured correctly in the settings panel and try again!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassPanel className="flex flex-col h-[400px] border border-white/10" intensity="medium">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/[0.02] border-b border-white/5">
        <div className="flex items-center space-x-2 text-[#F3EDE7]">
          <Sparkles className="w-4 h-4 text-[#E8793A] animate-pulse" />
          <span className="text-xs font-bold tracking-wider uppercase">AI Assistant & Search Grounding</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E8793A]/10 text-[#E8793A]">
            {selectedModel === "llm7" ? "LLM7 Custom" : selectedModel}
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1 rounded-md hover:bg-white/10 text-[#B8ADA3] hover:text-white transition-all cursor-pointer ${showSettings ? "bg-white/10 text-white" : ""}`}
            title="AI Settings & API Key"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-black/50 border-b border-white/5 space-y-3.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#E8793A] uppercase tracking-wider block">AI API & Model Config</span>
            <span className="text-[9px] text-[#B8ADA3]">Active Key Loaded</span>
          </div>

          <div className="space-y-2.5">
            {/* API Key Input */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Gemini / Custom API Key</label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setTestStatus(null);
                    }}
                    placeholder="Enter custom Gemini API key..."
                    className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-xs font-mono text-[#F3EDE7] focus:border-[#E8793A] focus:outline-none"
                  />
                  <Key className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={isTestingKey || !apiKey}
                  className="px-3 py-1.5 rounded-lg bg-[#E8793A]/10 hover:bg-[#E8793A]/20 text-[#E8793A] border border-[#E8793A]/30 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1 shrink-0"
                >
                  {isTestingKey ? "Testing..." : "Test Key"}
                </button>
              </div>
            </div>

            {testStatus && (
              <div className={`text-[10px] p-2.5 rounded-lg border font-medium ${
                testStatus.valid
                  ? "bg-[#7FBF8E]/10 border-[#7FBF8E]/25 text-[#7FBF8E]"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                {testStatus.valid ? (
                  <div className="flex items-start gap-1.5">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-[#7FBF8E]" />
                    <span>API Key is VALID! Response from model: "{testStatus.response}"</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <span>Error testing API key: {testStatus.error}</span>
                  </div>
                )}
              </div>
            )}

            {/* Model Select */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Select Active Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-xs text-[#F3EDE7] focus:border-[#E8793A] focus:outline-none cursor-pointer"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="llm7">LLM7 Custom Model (Mapped)</option>
              </select>
            </div>
            
            {apiKey && (
              <div className="flex items-center space-x-1.5 text-[10px] text-[#7FBF8E] font-medium pt-1 bg-[#7FBF8E]/5 p-2 rounded-lg border border-[#7FBF8E]/10">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Custom secure API key is bound & will be used for queries!</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div
              key={idx}
              className={`flex flex-col max-w-[85%] ${
                isUser ? "ml-auto items-end" : "mr-auto items-start"
              }`}
            >
              <div
                className={`p-3 rounded-xl text-xs leading-relaxed ${
                  isUser
                    ? "bg-[#E8793A] text-[#1C1512] font-semibold rounded-br-none"
                    : "bg-white/[0.04] text-[#F3EDE7] border border-white/5 rounded-bl-none"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                {/* Grounded Web search links */}
                {!isUser && m.sources && m.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                    <p className="text-[9px] font-bold text-[#E8793A] tracking-wider uppercase">Google Search Grounding Sources:</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {m.sources.map((s, sIdx) => (
                        <a
                          key={sIdx}
                          href={s.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-black/40 hover:bg-black/60 text-[9px] text-[#B8ADA3] hover:text-white transition-all font-mono"
                        >
                          <span className="truncate max-w-[120px]">{s.title}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-center space-x-2 mr-auto bg-white/[0.02] border border-white/5 p-3 rounded-xl rounded-bl-none">
            <RefreshCw className="w-3.5 h-3.5 text-[#E8793A] animate-spin" />
            <span className="text-[10px] text-[#B8ADA3] font-medium animate-pulse">Consulting Google Search...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white/[0.01] border-t border-white/5 flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask about cursor installation, troubleshooting..."
          className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-[#F3EDE7] focus:border-[#E8793A] focus:outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="p-2 rounded-lg bg-[#E8793A] hover:bg-[#F2925C] text-[#1C1512] font-semibold transition-all disabled:opacity-50 cursor-pointer"
          disabled={isLoading || !inputValue.trim()}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </GlassPanel>
  );
};
