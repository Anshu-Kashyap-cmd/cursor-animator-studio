import React, { useState } from "react";
import { ArrowLeft, User as UserIcon, ShieldAlert, Sliders, Palette, LogOut, Check, Trash2 } from "lucide-react";
import { GlassPanel } from "../components/GlassPanel.tsx";
import { User, deleteUser } from "firebase/auth";
import { signOut } from "../db/firebase.ts";

interface SettingsProps {
  user: User | null;
  onNavigateHome: () => void;
  // Accent configurations
  accentColor: string;
  setAccentColor: (color: string) => void;
  // Default configurations
  defaultDurationMs: number;
  setDefaultDurationMs: (ms: number) => void;
  defaultFrameCount: number;
  setDefaultFrameCount: (count: number) => void;
  onLogout: () => void;
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
  onLogout,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSignOut = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await signOut();
      onLogout();
      showToast("Signed out successfully.");
    }
  };

  const handleDeleteAccount = async () => {
    if (user) {
      const confirmFirst = confirm("WARNING: This will permanently delete your user profile and saved cloud cursor files. This action cannot be undone. Do you wish to continue?");
      if (confirmFirst) {
        const confirmSecond = prompt("To confirm deletion, please type your email address exactly:");
        if (confirmSecond === user.email) {
          try {
            await deleteUser(user);
            onLogout();
            alert("Your account was successfully deleted.");
            onNavigateHome();
          } catch (err: any) {
            console.error(err);
            alert("For security reasons, deleting your account requires a recent login. Please sign out, log back in, and try again.");
          }
        } else {
          alert("Email did not match. Account deletion cancelled.");
        }
      }
    }
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
                      showToast(`Accent color updated to ${acc.name}!`);
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer ${
                      isActive
                        ? "border-[#E8793A] bg-white/[0.06] scale-105 shadow-[0_0_12px_rgba(232,121,58,0.1)]"
                        : "border-white/5 bg-black/20 hover:border-white/10 hover:bg-black/30 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-white/20 shadow-md"
                      style={{ backgroundColor: acc.hex }}
                    />
                    <span className="text-[10px] font-mono font-bold leading-none">{acc.name}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#B8ADA3] leading-normal pt-1 font-sans">
              Adjusts the glowing accents, progress trackers, and spark-trail color highlights inside the canvas and timelines.
            </p>
          </div>
        </GlassPanel>

        {/* 2. Default workspace configs */}
        <GlassPanel className="p-6 space-y-4" intensity="medium">
          <div className="flex items-center space-x-2 text-[#F3EDE7]">
            <Sliders className="w-4.5 h-4.5 text-[#E8793A]" />
            <h3 className="font-bold text-sm tracking-tight">Compiler Presets</h3>
          </div>

          <div className="h-px bg-white/10 w-full"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#B8ADA3] uppercase tracking-wider block">
                Default Export Loop Duration
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  step="0.5"
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
        </GlassPanel>

        {/* 3. Authentication profile details */}
        {user ? (
          <GlassPanel className="p-6 space-y-4" intensity="medium">
            <div className="flex items-center space-x-2 text-[#F3EDE7]">
              <UserIcon className="w-4.5 h-4.5 text-[#E8793A]" />
              <h3 className="font-bold text-sm tracking-tight">Account Sync</h3>
            </div>

            <div className="h-px bg-white/10 w-full"></div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-black/20 border border-white/5">
              <div className="flex items-center space-x-3">
                <img
                  src={user.photoURL || "https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_512dp.png"}
                  alt={user.displayName || "User"}
                  className="w-11 h-11 rounded-full border border-white/10"
                />
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold text-[#F3EDE7] block">{user.displayName || "Google User"}</span>
                  <span className="text-neutral-500 font-mono block">{user.email}</span>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 text-xs font-bold transition-all text-[#B8ADA3] hover:text-white cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-2">
              <div className="flex items-center space-x-2 text-[#E0B84C]">
                <ShieldAlert className="w-4.5 h-4.5" />
                <span className="text-xs font-bold uppercase tracking-wider">Danger Zone</span>
              </div>
              <p className="text-[11px] text-[#B8ADA3] leading-normal font-sans">
                Permanently delete all your cloud projects and remove this account. Files stored locally in IndexedDB will remain unaffected.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 border border-red-500/10 transition-all cursor-pointer mt-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </GlassPanel>
        ) : (
          <div className="p-6 rounded-2xl bg-[#6E5A7B]/5 border border-[#6E5A7B]/10 text-center text-xs space-y-1">
            <h4 className="font-bold text-[#F3EDE7]">Running in Guest Mode</h4>
            <p className="text-[#B8ADA3]">Settings are applied client-side. Sign in to sync your profile configurations across devices!</p>
          </div>
        )}
      </main>

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
