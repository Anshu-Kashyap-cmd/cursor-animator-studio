import React, { useState } from "react";
import { 
  X, 
  User as UserIcon, 
  Chrome, 
  Sparkles, 
  Loader2, 
  Check, 
  AlertCircle,
  Lock
} from "lucide-react";
import { DEV_PASSCODE } from "../lib/devMode.ts";

interface AuthModalProps {
  onClose: () => void;
  onGoogleSignIn: () => Promise<void>;
  onGuestSignIn: (name: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onGoogleSignIn,
  onGuestSignIn,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Developer states
  const [isDev, setIsDev] = useState(() => localStorage.getItem("developer_mode") === "true");
  const [clickCount, setClickCount] = useState(0);
  const [showPasscodePrompt, setShowPasscodePrompt] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [activeTab, setActiveTab] = useState<"google" | "guest">("google");
  const [guestName, setGuestName] = useState("");

  const handleTitleClick = () => {
    if (isDev) return;
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 5) {
      setShowPasscodePrompt(true);
      setClickCount(0);
    }
  };

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === DEV_PASSCODE) {
      localStorage.setItem("developer_mode", "true");
      setIsDev(true);
      setSuccessMsg("Developer Mode activated! Free Guest profile unlocked.");
      setActiveTab("guest");
      setShowPasscodePrompt(false);
      setPasscode("");
      setError(null);
    } else {
      setError("Incorrect developer passcode. Access denied.");
    }
  };

  const handleGoogleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      await onGoogleSignIn();
    } catch (err: any) {
      setError("Google Sign-In popup was blocked or closed. Please open the live web app directly at https://cursor-animator-studio.ai.studio in a full browser tab to complete Google Sign-In.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError("Please enter a name for your guest profile.");
      return;
    }
    onGuestSignIn(guestName.trim());
  };

  const handleDeactivateDev = () => {
    localStorage.removeItem("developer_mode");
    setIsDev(false);
    setActiveTab("google");
    setSuccessMsg("Developer Mode deactivated. Client simulation view is now active.");
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gradient-to-b from-[#241A22] to-[#1C1512] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top visual gradient line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E8793A] via-[#8A2BE2] to-[#FF1493]"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 select-none">
          <div className="space-y-0.5 cursor-pointer" onClick={handleTitleClick}>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#E8793A]" />
              <span>Studio Account Access</span>
              {isDev && (
                <span className="text-[9px] bg-red-500/25 text-red-300 font-extrabold px-1.5 py-0.5 rounded border border-red-500/30 tracking-wider uppercase ml-1 animate-pulse">
                  DEV
                </span>
              )}
            </h3>
            <p className="text-[10px] text-[#B8ADA3]">Select how you want to save your customized cursors</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs navigation - ONLY visible in Developer Mode */}
        {isDev && (
          <div className="grid grid-cols-2 gap-1 px-4 py-2 bg-black/25 border-b border-white/5">
            <button
              onClick={() => {
                setActiveTab("google");
                setError(null);
              }}
              className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                activeTab === "google"
                  ? "bg-[#E8793A] text-[#1C1512] shadow-sm"
                  : "text-[#B8ADA3] hover:text-white hover:bg-white/[0.02]"
              }`}
            >
              <Chrome className="w-3.5 h-3.5 mx-auto" />
              <span>Google Login</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("guest");
                setError(null);
              }}
              className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                activeTab === "guest"
                  ? "bg-[#E8793A] text-[#1C1512] shadow-sm"
                  : "text-[#B8ADA3] hover:text-white hover:bg-white/[0.02]"
              }`}
            >
              <UserIcon className="w-3.5 h-3.5 mx-auto" />
              <span>Guest Profile (Free Dev)</span>
            </button>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Notifications */}
          {error && (
            <div className="flex items-start space-x-2 p-3 rounded-xl bg-red-500/10 border border-red-500/15 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start space-x-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/15 text-xs text-emerald-200">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Developer Passcode prompt */}
          {showPasscodePrompt && (
            <form onSubmit={handlePasscodeSubmit} className="space-y-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10 animate-fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                <Lock className="w-3.5 h-3.5" />
                <span>Enter Developer Passcode</span>
              </div>
              <p className="text-[10px] text-neutral-400">Unlock developer Guest mode & advanced settings simulation.</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  required
                  placeholder="Passcode..."
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-xs text-white focus:border-[#E8793A] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#E8793A] hover:bg-[#F2925C] text-[#1C1512] text-xs font-bold rounded-lg cursor-pointer"
                >
                  Verify
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasscodePrompt(false);
                    setPasscode("");
                    setError(null);
                  }}
                  className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* TAB 1: GOOGLE LOGIN */}
          {(!isDev || activeTab === "google") && (
            <div className="space-y-4 py-2">
              <div className="text-xs text-[#B8ADA3] leading-relaxed space-y-2">
                <p>
                  Sign in with your Google account to automatically synchronize your active designs, export histories, and configurations securely to our persistent database.
                </p>
                <div className="p-3 rounded-xl bg-[#E8793A]/5 border border-[#E8793A]/10 text-[11px] text-[#E8793A]/90 space-y-1.5">
                  <p>
                    🌐 <strong>Live Web App:</strong>{" "}
                    <a
                      href="https://cursor-animator-studio.ai.studio"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-bold text-white hover:text-[#FFA873]"
                    >
                      cursor-animator-studio.ai.studio
                    </a>
                  </p>
                  <p className="text-[10px] text-[#B8ADA3]">
                    Google popups require a top-level browser window. If you are viewing inside an embedded preview frame, please open the live link above to sign in with Google seamlessly.
                  </p>
                </div>
              </div>

              <button
                onClick={handleGoogleClick}
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#E8793A] hover:bg-[#F2925C] text-[#1C1512] font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-2.5 mt-2 cursor-pointer shadow-lg hover:shadow-[#E8793A]/10"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#1C1512]" />
                ) : (
                  <>
                    <Chrome className="w-4 h-4 text-[#1C1512]" />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: GUEST PROFILE */}
          {isDev && activeTab === "guest" && (
            <form onSubmit={handleGuestSubmit} className="space-y-4 py-2">
              <div className="text-[11px] text-[#B8ADA3] leading-relaxed bg-[#E8793A]/5 border border-[#E8793A]/10 p-3 rounded-xl">
                👤 <strong>Developer Free Guest Session:</strong> You are utilizing the developer bypass option. Your designs and settings will save locally.
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Developer Nickname</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Developer, Admin, Owner"
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-900 border border-white/10 text-xs text-white focus:border-[#E8793A] focus:outline-none"
                  />
                  <UserIcon className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#E8793A] hover:bg-[#F2925C] text-[#1C1512] font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 mt-4 cursor-pointer"
              >
                <span>Activate Free Guest Session</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-between text-[10px] text-neutral-500">
          <span>Secure authentication standard</span>
          {isDev && (
            <button
              onClick={handleDeactivateDev}
              className="text-red-400 hover:text-red-300 font-semibold cursor-pointer underline"
            >
              Client Simulation Mode
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
