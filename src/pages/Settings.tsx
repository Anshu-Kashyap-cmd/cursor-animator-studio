import React, { useState } from "react";
import { ArrowLeft, HardDriveDownload, Palette, Sliders, Check, HelpCircle, Briefcase, MousePointer, Info, X, ShieldCheck, Cpu, Code, Lock } from "lucide-react";
import { GlassPanel } from "../components/GlassPanel.tsx";
import { CreatorBanner } from "../components/CreatorBanner.tsx";
import { PolicyModal, PolicyTab } from "../components/PolicyModal.tsx";
import { isDeveloperUser } from "../lib/devMode.ts";

interface SettingsProps {
  user?: any;
  onNavigateHome: () => void;
  // Accent configurations
  accentColor: string;
  setAccentColor: (color: string) => void;
  // Default configurations
  defaultDurationMs: number;
  setDefaultDurationMs: (ms: number) => void;
  defaultFrameCount: number;
  setDefaultFrameCount: (count: number) => void;
  onLogout?: () => void;
}

const ACCENTS = [
  { name: "Cursor Amber", hex: "#E8793A" },
  { name: "Nebula Violet", hex: "#8A2BE2" },
  { name: "Cyberpunk Pink", hex: "#FF1493" },
  { name: "Matrix Green", hex: "#00FF00" },
  { name: "Deep Ocean Blue", hex: "#1E90FF" },
];

export const Settings: React.FC<SettingsProps> = ({
  user,
  onNavigateHome,
  accentColor,
  setAccentColor,
  defaultDurationMs,
  setDefaultDurationMs,
  defaultFrameCount,
  setDefaultFrameCount,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [faqTab, setFaqTab] = useState<"file_fix" | "how_to_use" | "business">("file_fix");
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [policyTab, setPolicyTab] = useState<PolicyTab>("privacy");
  const isDev = isDeveloperUser(user);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#1C1512] text-[#F3EDE7] py-8 px-6">
      {/* Header bar */}
      <header className="max-w-3xl mx-auto w-full flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <button
            onClick={onNavigateHome}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#B8ADA3] hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-white/10"></div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2A1810] via-[#1C1512] to-[#2E1838] flex items-center justify-center border border-[#E8793A]/40 overflow-hidden shrink-0 shadow-md shadow-[#E8793A]/10">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-0.5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-[#B8ADA3] bg-clip-text text-transparent">
            Application Settings
          </h1>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto w-full flex-1 space-y-6">
        {/* 1. Theme configuration */}
        <GlassPanel className="p-6 space-y-4" intensity="medium">
          <div className="flex items-center space-x-2 text-[#F3EDE7]">
            <Palette className="w-4.5 h-4.5 text-[#E8793A]" />
            <h3 className="font-bold text-sm tracking-tight">Theme & Styling</h3>
          </div>
          
          <div className="h-px bg-white/10 w-full"></div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-[#B8ADA3] uppercase tracking-wider block">
              Application Accent Glow Balance
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {ACCENTS.map((acc) => {
                const isActive = accentColor.toUpperCase() === acc.hex.toUpperCase();
                return (
                  <button
                    key={acc.hex}
                    onClick={() => {
                      setAccentColor(acc.hex);
                      showToast(`Accent updated to ${acc.name}`);
                    }}
                    className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-white/10 border-[#E8793A] text-white shadow-lg shadow-[#E8793A]/10"
                        : "bg-black/20 border-white/5 text-[#B8ADA3] hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0"
                      style={{ backgroundColor: acc.hex }}
                    />
                    <span className="truncate">{acc.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </GlassPanel>

        {/* 2. Compiler Default Presets */}
        <GlassPanel className="p-6 space-y-4" intensity="medium">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[#F3EDE7]">
              <Sliders className="w-4.5 h-4.5 text-[#E8793A]" />
              <h3 className="font-bold text-sm tracking-tight">Compiler Default Presets</h3>
            </div>
            {!isDev && (
              <span className="text-[10px] bg-white/5 text-[#B8ADA3] px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1 font-mono">
                <Lock className="w-3 h-3 text-[#E8793A]" /> Locked
              </span>
            )}
          </div>
          
          <div className="h-px bg-white/10 w-full"></div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${!isDev ? "opacity-65 select-none pointer-events-none" : ""}`}>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#B8ADA3] uppercase tracking-wider block">
                Default Export Loop Duration
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  step="0.5"
                  disabled={!isDev}
                  value={defaultDurationMs / 1000}
                  onChange={(e) => {
                    const sec = parseFloat(e.target.value) || 5.5;
                    setDefaultDurationMs(Math.max(1, Math.min(15, sec)) * 1000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-sm font-mono text-[#F3EDE7] focus:border-[#E8793A] focus:outline-none w-24"
                />
                <span className="text-xs text-[#B8ADA3]">Seconds (Loop)</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#B8ADA3] uppercase tracking-wider block">
                Default Frame Count
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  disabled={!isDev}
                  value={defaultFrameCount}
                  onChange={(e) => {
                    const cnt = parseInt(e.target.value) || 18;
                    setDefaultFrameCount(Math.max(6, Math.min(60, cnt)));
                  }}
                  className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-sm font-mono text-[#F3EDE7] focus:border-[#E8793A] focus:outline-none w-24"
                />
                <span className="text-xs text-[#B8ADA3]">Frames</span>
              </div>
            </div>
          </div>
          {!isDev && (
            <p className="text-[10px] text-[#B8ADA3]/70 italic mt-1 font-sans">
              Note: Compiler settings are optimized for standard 60Hz and 120Hz display refresh rates.
            </p>
          )}
        </GlassPanel>

        {/* 3. Offline Workspace & Storage Status */}
        <GlassPanel className="p-6 space-y-4" intensity="medium">
          <div className="flex items-center space-x-2 text-[#F3EDE7]">
            <HardDriveDownload className="w-4.5 h-4.5 text-[#E8793A]" />
            <h3 className="font-bold text-sm tracking-tight">Open-Source Local Storage (IndexedDB)</h3>
          </div>

          <div className="h-px bg-white/10 w-full"></div>

          <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-bold text-[#F3EDE7]">Storage Engine:</span>
              <span className="text-[#7FBF8E] font-mono font-bold bg-[#7FBF8E]/10 px-2.5 py-1 rounded border border-[#7FBF8E]/20">
                Offline-First IndexedDB (Local & Private)
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-bold text-[#F3EDE7]">Access Policy:</span>
              <span className="text-[#E8793A] font-mono font-bold bg-[#E8793A]/10 px-2.5 py-1 rounded border border-[#E8793A]/20">
                100% Free & Open-Source (No Login Required)
              </span>
            </div>
            <p className="text-[11px] text-[#B8ADA3] leading-relaxed pt-1">
              Your animations, frame assets, custom keyframes, and video extractions are saved directly inside your browser database. No external accounts, passwords, or cloud logins required!
            </p>
          </div>
        </GlassPanel>

        {/* 4. Troubleshooting & Help Center */}
        <GlassPanel className="p-6 space-y-4" intensity="medium">
          <div className="flex items-center space-x-2 text-[#F3EDE7]">
            <HelpCircle className="w-4.5 h-4.5 text-[#E8793A]" />
            <h3 className="font-bold text-sm tracking-tight">Troubleshooting & Creator Guides</h3>
          </div>

          <div className="h-px bg-white/10 w-full"></div>

          {/* Tab buttons */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/30 border border-white/5">
            <button
              onClick={() => setFaqTab("file_fix")}
              className={`py-2 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                faqTab === "file_fix"
                  ? "bg-[#E8793A] text-[#1C1512] shadow-md shadow-[#E8793A]/15"
                  : "text-[#B8ADA3] hover:text-[#F3EDE7] hover:bg-white/[0.02]"
              }`}
            >
              🛠️ .ani File Fix
            </button>
            <button
              onClick={() => setFaqTab("how_to_use")}
              className={`py-2 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                faqTab === "how_to_use"
                  ? "bg-[#E8793A] text-[#1C1512] shadow-md shadow-[#E8793A]/15"
                  : "text-[#B8ADA3] hover:text-[#F3EDE7] hover:bg-white/[0.02]"
              }`}
            >
              🖱️ How to Use Cursors
            </button>
            <button
              onClick={() => setFaqTab("business")}
              className={`py-2 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                faqTab === "business"
                  ? "bg-[#E8793A] text-[#1C1512] shadow-md shadow-[#E8793A]/15"
                  : "text-[#B8ADA3] hover:text-[#F3EDE7] hover:bg-white/[0.02]"
              }`}
            >
              💼 Monetization Guide
            </button>
          </div>

          {/* Tab 1: File Fix */}
          {faqTab === "file_fix" && (
            <div className="space-y-4 pt-2 text-xs leading-relaxed">
              <div className="space-y-1.5">
                <span className="font-bold text-[#F3EDE7] block">⚠️ Why does Windows say my .ani file is invalid or corrupt?</span>
                <p className="text-[#B8ADA3]">
                  Windows Animated Cursor formats (`.ani`) use a strict RIFF/ACON container. If the frame rates or icon chunk sizes are malformed, Windows Mouse Settings will display an error:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[#B8ADA3] pl-1">
                  <li>Keep frame resolutions consistent (e.g., all frames exactly 32x32 or 48x48).</li>
                  <li>Avoid exporting more than 60 frames in a single `.ani` file for optimum Windows performance.</li>
                  <li>Ensure the Hotspot (X, Y) is placed within the dimensions of the cursor frame.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Tab 2: How to use */}
          {faqTab === "how_to_use" && (
            <div className="space-y-4 pt-2 text-xs leading-relaxed">
              <div className="space-y-1.5">
                <span className="font-bold text-[#F3EDE7] block">🖱️ How to apply .ani files on Windows 10 & Windows 11:</span>
                <ol className="list-decimal list-inside space-y-1.5 text-[#B8ADA3] pl-1">
                  <li>Export your animated cursor as a <code className="font-mono text-white bg-white/5 px-1 rounded">.ani</code> file.</li>
                  <li>Press <kbd className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white">Win + R</kbd>, type <code className="font-mono text-white bg-white/5 px-1 rounded">main.cpl</code> and hit Enter.</li>
                  <li>Select the <strong>"Pointers"</strong> tab.</li>
                  <li>Click on the cursor state you want to customize (e.g. <em>Normal Select</em>, <em>Help Select</em>, or <em>Working in Background</em>).</li>
                  <li>Click <strong>"Browse..."</strong>, choose your downloaded file, and click <strong>"Apply"</strong>!</li>
                </ol>
              </div>
            </div>
          )}

          {/* Tab 3: Business & Monetization */}
          {faqTab === "business" && (
            <div className="space-y-4 pt-2 text-xs leading-relaxed">
              <div className="space-y-1.5">
                <span className="font-bold text-[#F3EDE7] block">💵 How to sell custom cursors:</span>
                <ul className="list-disc list-inside space-y-1.5 text-[#B8ADA3] pl-1">
                  <li><strong className="text-white">Animated Cursor Packs ($5 - $15):</strong> Bundle 5-10 themed cursors (e.g. Neon Cyberpunk, Minimalist Glass, Gaming Crosshairs) and sell on Gumroad or itch.io.</li>
                  <li><strong className="text-white">Streamer & Freelance Client Commissions ($30 - $100):</strong> Transform streamer logos or game mascots into animated Windows pointers!</li>
                </ul>
              </div>
            </div>
          )}
        </GlassPanel>

        {/* 5. Security, Privacy & Legal Compliance */}
        <GlassPanel className="p-6 space-y-4" intensity="medium">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[#F3EDE7]">
              <ShieldCheck className="w-4.5 h-4.5 text-[#7FBF8E]" />
              <h3 className="font-bold text-sm tracking-tight">Security, Privacy & Legal Policies</h3>
            </div>
            <span className="text-[10px] bg-[#7FBF8E]/10 text-[#7FBF8E] px-2.5 py-0.5 rounded-full border border-[#7FBF8E]/25 font-bold flex items-center gap-1">
              <Check className="w-3 h-3" /> Verified Safe
            </span>
          </div>

          <div className="h-px bg-white/10 w-full"></div>

          <p className="text-xs text-[#B8ADA3] leading-relaxed">
            Cursor Animator Studio is an open-source, 100% login-free desktop utility. Your media files, frames, and cursor binaries are processed locally in RAM with zero remote tracking or cloud storage.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <button
              onClick={() => {
                setPolicyTab("privacy");
                setIsPolicyOpen(true);
              }}
              className="flex items-center space-x-2 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-[#7FBF8E]/40 text-left transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#7FBF8E]/15 text-[#7FBF8E] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Lock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#F3EDE7] group-hover:text-white">Privacy Policy</div>
                <div className="text-[10px] text-[#B8ADA3] truncate">Zero tracking & local memory</div>
              </div>
            </button>

            <button
              onClick={() => {
                setPolicyTab("security");
                setIsPolicyOpen(true);
              }}
              className="flex items-center space-x-2 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-[#E8793A]/40 text-left transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#E8793A]/15 text-[#FFA873] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#F3EDE7] group-hover:text-white">Security Specs</div>
                <div className="text-[10px] text-[#B8ADA3] truncate">Buffer safety & disclosures</div>
              </div>
            </button>

            <button
              onClick={() => {
                setPolicyTab("disclaimer");
                setIsPolicyOpen(true);
              }}
              className="flex items-center space-x-2 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 text-left transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Info className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#F3EDE7] group-hover:text-white">Disclaimer & Terms</div>
                <div className="text-[10px] text-[#B8ADA3] truncate">MIT license & user ownership</div>
              </div>
            </button>
          </div>
        </GlassPanel>

        {/* Creator Showcase Banner */}
        <div className="mt-8">
          <CreatorBanner variant="compact" />
        </div>
      </main>

      {/* Policy Modal */}
      <PolicyModal
        isOpen={isPolicyOpen}
        onClose={() => setIsPolicyOpen(false)}
        initialTab={policyTab}
      />

      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 p-4 rounded-xl bg-neutral-900 border border-white/10 text-xs font-semibold text-[#F3EDE7] shadow-2xl flex items-center space-x-2">
          <Check className="w-4 h-4 text-[#7FBF8E]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
