import React, { useState } from "react";
import { ArrowLeft, User as UserIcon, ShieldAlert, Sliders, Palette, LogOut, Check, Trash2, HelpCircle, Briefcase, MousePointer, Info, X, ShieldCheck, Cpu, Code, Lock } from "lucide-react";
import { GlassPanel } from "../components/GlassPanel.tsx";
import { deleteUser } from "firebase/auth";
import { auth, signOut } from "../db/firebase.ts";
import { isDeveloperUser } from "../lib/devMode.ts";

interface SettingsProps {
  user: any;
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
  const [faqTab, setFaqTab] = useState<"file_fix" | "how_to_use" | "business">("file_fix");

  // Custom inline overlay states to bypass iframe confirm/prompt/alert block constraints
  const [activeDialog, setActiveDialog] = useState<
    | null
    | { type: "sign_out" }
    | { type: "delete_guest" }
    | { type: "delete_user_step1" }
    | { type: "delete_user_step2" }
    | { type: "alert"; title: string; message: string; onOk?: () => void }
  >(null);
  const [confirmEmail, setConfirmEmail] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isGuest = user && typeof user.uid === "string" && user.uid.startsWith("guest_");
  const isDev = isDeveloperUser(user);

  const handleSignOutClick = () => {
    setActiveDialog({ type: "sign_out" });
  };

  const confirmSignOut = async () => {
    setActiveDialog(null);
    if (!isGuest) {
      try {
        await signOut();
      } catch (e) {
        console.error("Firebase sign out error:", e);
      }
    }
    localStorage.removeItem("local_guest_user");
    onLogout();
  };

  const handleDeleteAccountClick = () => {
    if (isGuest) {
      setActiveDialog({ type: "delete_guest" });
    } else {
      setActiveDialog({ type: "delete_user_step1" });
    }
  };

  const confirmDeleteGuest = () => {
    setActiveDialog(null);
    localStorage.removeItem("local_guest_user");
    onLogout();
    setActiveDialog({
      type: "alert",
      title: "Guest Profile Removed",
      message: "Your guest profile has been successfully deleted.",
      onOk: onNavigateHome
    });
  };

  const proceedToDeleteUserStep2 = () => {
    setConfirmEmail("");
    setActiveDialog({ type: "delete_user_step2" });
  };

  const confirmDeleteUser = async () => {
    if (confirmEmail !== user?.email) {
      setActiveDialog({
        type: "alert",
        title: "Mismatch Error",
        message: "Email did not match. Account deletion cancelled.",
        onOk: () => setActiveDialog(null)
      });
      return;
    }

    try {
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
      } else {
        throw new Error("No active user session detected.");
      }
      onLogout();
      setActiveDialog({
        type: "alert",
        title: "Account Deleted",
        message: "Your account and all saved cloud cursor projects were successfully deleted.",
        onOk: onNavigateHome
      });
    } catch (err: any) {
      console.error(err);
      setActiveDialog({
        type: "alert",
        title: "Re-authentication Required",
        message: "For security reasons, deleting your account requires a recent login. Please sign out, log back in, and try again.",
        onOk: () => setActiveDialog(null)
      });
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
        <GlassPanel className="p-6 space-y-4 relative overflow-hidden" intensity="medium">
          <div className="flex items-center justify-between text-[#F3EDE7]">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4.5 h-4.5 text-[#E8793A]" />
              <h3 className="font-bold text-sm tracking-tight">Compiler Presets</h3>
            </div>
            {!isDev && (
              <span className="flex items-center gap-1.5 text-[9px] bg-red-500/10 border border-red-500/20 text-red-300 font-extrabold px-2.5 py-1 rounded-full select-none">
                <Lock className="w-2.5 h-2.5 text-[#E8793A]" />
                Developer Locked
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
              Note: Compiler settings are developer-locked to optimize standard frame builds. Contact the administrator (<strong>Mahi - mehraansh023@gmail.com</strong>) to request changes.
            </p>
          )}
        </GlassPanel>

        {/* Developer controls - ONLY visible if isDev is true */}
        {isDev && (
          <GlassPanel className="p-6 space-y-4 border border-red-500/25 relative overflow-hidden" intensity="medium">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-[#E8793A]"></div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-red-400">
                <Cpu className="w-4.5 h-4.5" />
                <h3 className="font-bold text-sm tracking-tight uppercase tracking-wider">Developer Control Center</h3>
              </div>
              <span className="text-[9px] bg-red-500/20 text-red-300 font-extrabold px-2.5 py-0.5 rounded-full border border-red-500/30">
                ADMIN ACCESS ACTIVE
              </span>
            </div>

            <div className="h-px bg-white/10 w-full"></div>

            <p className="text-xs text-[#B8ADA3]">
              Bhai, ye control panel sirf aapke liye active hai! Yahan se aap local bypass settings change kar sakte hain aur client preview simulations verify kar sakte hain.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Diagnostics</span>
                <div className="space-y-1 font-mono text-[11px] text-neutral-300">
                  <div className="flex justify-between">
                    <span>Developer Email:</span>
                    <span className="text-[#E8793A]">mehraansh023@gmail.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Database Engine:</span>
                    <span className="text-emerald-400">Firebase Firestore</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auth Bypass:</span>
                    <span className="text-red-400">Local Guest Active</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Developer Actions</span>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Test app behavior as if you are a normal client buying the app.</p>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem("developer_mode");
                    showToast("Developer Mode deactivated! Switched to Client simulation.");
                    setTimeout(() => window.location.reload(), 800);
                  }}
                  className="w-full mt-3 py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/25 font-bold text-xs rounded-lg transition-all cursor-pointer"
                >
                  Switch to Client View
                </button>
              </div>
            </div>
          </GlassPanel>
        )}

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
                onClick={handleSignOutClick}
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
                onClick={handleDeleteAccountClick}
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

        {/* 4. Troubleshooting & Help Center */}
        <GlassPanel className="p-6 space-y-4" intensity="medium">
          <div className="flex items-center space-x-2 text-[#F3EDE7]">
            <HelpCircle className="w-4.5 h-4.5 text-[#E8793A]" />
            <h3 className="font-bold text-sm tracking-tight">Troubleshooting & Creator Business Guide</h3>
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
              💼 Client Business Guide
            </button>
          </div>

          {/* Tab Content 1: .ani File Association Fix */}
          {faqTab === "file_fix" && (
            <div className="space-y-3.5 pt-1.5">
              <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-xs">
                <Info className="w-4 h-4 text-[#E8793A] flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-[#F3EDE7] block">Problem: .ani files opening in Video Player (VLC)?</span>
                  <span className="text-[#B8ADA3] leading-relaxed block">
                    If your computer shows video player icons (like VLC, Media Player) for downloaded <code className="px-1 py-0.5 bg-white/5 rounded text-[#E8793A] font-mono">.ani</code> files, you accidentally set a media player as your default program. Don't worry! Your animated cursor files are completely fine—they just aren't videos!
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <span className="font-bold text-[#F3EDE7] block">How to Fix on your Desktop PC (In Hindi & English):</span>
                <ol className="list-decimal list-inside space-y-2 text-[#B8ADA3] leading-relaxed pl-1">
                  <li>
                    <strong className="text-white">Right-click</strong> any downloaded <code className="px-1 rounded bg-white/5 font-mono">.ani</code> file on your computer.
                  </li>
                  <li>
                    Select <strong className="text-white">Properties</strong> from the menu (or hover on "Open with" and click "Choose another app").
                  </li>
                  <li>
                    Find the <strong className="text-white">Opens with:</strong> section and click the <strong className="text-[#E8793A]">Change...</strong> button.
                  </li>
                  <li>
                    Choose a cursor utility, web browser, or reset it. You can also search Windows Settings for <strong className="text-white">"Default Apps by file type"</strong>, scroll down to <code className="font-mono text-white">.ani</code>, and clear or change the association.
                  </li>
                  <li>
                    <span className="text-emerald-400">Done!</span> The file will no longer try to play as a video. You can load it directly into Windows Mouse Settings to see it in action!
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Tab Content 2: How to use custom cursors */}
          {faqTab === "how_to_use" && (
            <div className="space-y-3 pt-1.5 text-xs leading-relaxed">
              <span className="font-bold text-[#F3EDE7] block">How to apply downloaded .ani cursors on Windows:</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="font-bold text-[#E8793A] block">Step 1: Open Control Panel</span>
                  <p className="text-[#B8ADA3]">
                    Press <kbd className="px-1 bg-white/10 rounded">Win + R</kbd>, type <code className="font-mono text-white">main.cpl</code> and click OK, or search "Mouse Settings" in your Windows search bar and click "Additional mouse options".
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="font-bold text-[#E8793A] block">Step 2: Go to Pointers Tab</span>
                  <p className="text-[#B8ADA3]">
                    Click on the <strong className="text-white">Pointers</strong> tab. Here you will see your current cursor scheme (e.g., Normal Select, Help, Busy).
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="font-bold text-[#E8793A] block">Step 3: Browse .ani File</span>
                  <p className="text-[#B8ADA3]">
                    Double-click on "Normal Select" or "Busy" cursor, or select it and click <strong className="text-white">Browse...</strong>. Select your downloaded custom <code className="font-mono">.ani</code> file.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="font-bold text-[#E8793A] block">Step 4: Save & Apply</span>
                  <p className="text-[#B8ADA3]">
                    Click <strong className="text-white">Apply</strong> and then <strong className="text-white">OK</strong>. Your customized animated cursor is active! You can save the scheme with a custom name.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 3: Business/Freelance/Selling Guide */}
          {faqTab === "business" && (
            <div className="space-y-3.5 pt-1.5 text-xs leading-relaxed">
              <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <Briefcase className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white block">Making Money as a Cursor & Web Designer</span>
                  <span className="text-[#B8ADA3] block">
                    You can easily monetize this application by selling custom cursor designs and client packaging services! People pay premium rates for custom aesthetics, gaming icons, and custom desktop experiences.
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <span className="font-bold text-[#F3EDE7] block">💵 How much can you charge? (Pricing Strategy):</span>
                  <ul className="list-disc list-inside space-y-1.5 text-[#B8ADA3] pl-1">
                    <li>
                      <strong className="text-white">Animated Cursor Packs ($5 - $15):</strong> Bundle 5-10 themed cursors (e.g. Neon Cyberpunk, Minimalist Glass, Gaming Crosshairs) and sell on Gumroad, Etsy, or itch.io as a digital download.
                    </li>
                    <li>
                      <strong className="text-white">Freelance Client Commissions ($30 - $100):</strong> Offer customized cursor animation services on Fiverr or Upwork for YouTubers, streamers, and website developers who want their logos transformed into active cursors!
                    </li>
                    <li>
                      <strong className="text-white">PWA / App Packaging Services ($150 - $400):</strong> Package small business websites into PWA desktop/mobile launchers using PWABuilder and set up custom branded cursors for their custom office systems!
                    </li>
                  </ul>
                </div>

                <p className="text-[11px] text-[#B8ADA3] italic font-sans bg-white/5 p-2 rounded-lg">
                  bhai, aap custom cursor icons create karke stream designers or gamers ko direct packages pitch kar sakte hain. Custom designs ki hamesha bohot value hoti hai!
                </p>
              </div>
            </div>
          )}
        </GlassPanel>
      </main>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 p-4 rounded-xl bg-neutral-900 border border-white/10 text-xs font-semibold text-[#F3EDE7] shadow-2xl flex items-center space-x-2">
          <Check className="w-4 h-4 text-[#7FBF8E]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Custom Active Dialog Modals */}
      {activeDialog && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gradient-to-b from-[#241A22] to-[#1C1512] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-[#E8793A] to-yellow-500"></div>

            {/* Sign Out Confirmation */}
            {activeDialog.type === "sign_out" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-white">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 flex-shrink-0">
                    <LogOut className="w-5.5 h-5.5" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight">Confirm Sign Out</h3>
                </div>
                <p className="text-xs text-[#B8ADA3] leading-relaxed">
                  Are you sure you want to sign out from your Cursor Studio account? Any unsaved edits will be preserved locally if you use the same device.
                </p>
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setActiveDialog(null)}
                    className="flex-1 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSignOut}
                    className="flex-1 py-2 px-4 rounded-xl bg-[#E8793A] hover:bg-[#F2925C] text-[#1C1512] font-bold text-xs transition-all cursor-pointer"
                  >
                    Yes, Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* Delete Guest Session Confirmation */}
            {activeDialog.type === "delete_guest" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-white">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0">
                    <Trash2 className="w-5.5 h-5.5" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight">Clear Guest Session</h3>
                </div>
                <p className="text-xs text-[#B8ADA3] leading-relaxed">
                  Are you sure you want to permanently delete your local guest profile? This will clear your temporary guest session.
                </p>
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setActiveDialog(null)}
                    className="flex-1 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteGuest}
                    className="flex-1 py-2 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    Delete Profile
                  </button>
                </div>
              </div>
            )}

            {/* Delete User Account Step 1 */}
            {activeDialog.type === "delete_user_step1" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-white">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0">
                    <ShieldAlert className="w-5.5 h-5.5" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-red-400">WARNING: Permanent Deletion</h3>
                </div>
                <p className="text-xs text-[#B8ADA3] leading-relaxed">
                  This action will permanently delete your user profile, settings, and all cursor projects saved on the cloud. This process cannot be undone. Do you wish to proceed?
                </p>
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setActiveDialog(null)}
                    className="flex-1 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={proceedToDeleteUserStep2}
                    className="flex-1 py-2 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Delete User Account Step 2 (Verification email check) */}
            {activeDialog.type === "delete_user_step2" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-white">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0">
                    <ShieldAlert className="w-5.5 h-5.5" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight">Verify Your Identity</h3>
                </div>
                <p className="text-xs text-[#B8ADA3] leading-relaxed">
                  To confirm deletion of your account and files, please type your email address exactly: <span className="text-white font-mono font-semibold bg-white/5 px-1.5 py-0.5 rounded select-all">{user?.email}</span>
                </p>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white focus:border-red-500 focus:outline-none placeholder-neutral-600"
                />
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setActiveDialog(null)}
                    className="flex-1 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteUser}
                    disabled={confirmEmail !== user?.email}
                    className="flex-1 py-2 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Permanently Delete
                  </button>
                </div>
              </div>
            )}

            {/* Alert Modal */}
            {activeDialog.type === "alert" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-white">
                  <div className="w-10 h-10 rounded-full bg-[#E8793A]/10 flex items-center justify-center text-[#E8793A] flex-shrink-0">
                    <Info className="w-5.5 h-5.5" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight">{activeDialog.title}</h3>
                </div>
                <p className="text-xs text-[#B8ADA3] leading-relaxed">
                  {activeDialog.message}
                </p>
                <div className="flex pt-2">
                  <button
                    onClick={() => {
                      const onOkCallback = activeDialog.onOk;
                      setActiveDialog(null);
                      if (onOkCallback) {
                        onOkCallback();
                      }
                    }}
                    className="w-full py-2 px-4 rounded-xl bg-[#E8793A] hover:bg-[#F2925C] text-[#1C1512] font-bold text-xs transition-all cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
