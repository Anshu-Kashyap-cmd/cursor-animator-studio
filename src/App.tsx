import React, { useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";
import { auth, signInWithGoogle } from "./db/firebase.ts";
import { ProjectData, ProjectFrame } from "./types.ts";
import { CursorFrame } from "./engine/curParser.ts";
import { Landing } from "./pages/Landing.tsx";
import { Editor } from "./pages/Editor.tsx";
import { Dashboard } from "./pages/Dashboard.tsx";
import { Settings } from "./pages/Settings.tsx";
import { AuthModal } from "./components/AuthModal.tsx";
import { AlertCircle, ExternalLink, Mail, Lock, User as UserIcon, Chrome, Sparkles, X, Key } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [currentPage, setCurrentPage] = useState<"landing" | "editor" | "dashboard" | "settings">("landing");
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Global settings
  const [accentColor, setAccentColor] = useState<string>("#E8793A");
  const [defaultDurationMs, setDefaultDurationMs] = useState<number>(5500);
  const [defaultFrameCount, setDefaultFrameCount] = useState<number>(18);

  const [activeProject, setActiveProject] = useState<ProjectData | null>(null);
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Global API Key error notification state
  const [globalApiError, setGlobalApiError] = useState<{ message: string; isWarning?: boolean } | null>(null);

  // Listen to Custom api-key-error events
  useEffect(() => {
    const handleApiKeyError = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setGlobalApiError({
          message: detail.message,
          isWarning: detail.isWarning,
        });
      }
    };
    window.addEventListener("api-key-error", handleApiKeyError);
    return () => {
      window.removeEventListener("api-key-error", handleApiKeyError);
    };
  }, []);

  // Listen to Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        const savedGuest = localStorage.getItem("local_guest_user");
        if (savedGuest) {
          try {
            setUser(JSON.parse(savedGuest));
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Update root element custom CSS variables based on accentColor
  useEffect(() => {
    document.documentElement.style.setProperty("--accent-orange", accentColor);
    // Darken/hover version of accent
    const hoverColor = accentColor === "#E8793A" ? "#F2925C" : `${accentColor}cc`;
    document.documentElement.style.setProperty("--accent-orange-hover", hoverColor);
  }, [accentColor]);

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleSelectProject = (project: ProjectData) => {
    setActiveProject(project);
    setCurrentPage("editor");
  };

  const handleCreateProjectFromFrames = (frames: CursorFrame[], name: string, mode: "auto" | "manual") => {
    const projectFrames: ProjectFrame[] = frames.map((f, idx) => ({
      frame_index: idx,
      duration_ms: f.durationMs,
      width: f.width,
      height: f.height,
      hotspot_x: f.hotspotX,
      hotspot_y: f.hotspotY,
      image_data: f.dataUrl,
    }));

    const newProject: ProjectData = {
      id: Math.random().toString(36).substring(2, 9),
      user_id: user?.uid || null,
      name: name || "Untitled Cursor",
      mode: mode,
      frame_count: projectFrames.length,
      total_duration_ms: projectFrames.reduce((sum, f) => sum + f.duration_ms, 0),
      effect_preset: mode === "auto" ? "spin" : null,
      easing: "linear",
      hotspot_x: projectFrames[0]?.hotspot_x || 0,
      hotspot_y: projectFrames[0]?.hotspot_y || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      frames: projectFrames,
    };

    setActiveProject(newProject);
    setCurrentPage("editor");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#1C1512] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E8793A] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1C1512] via-[#20171B] to-[#241A22] font-sans antialiased text-[#F3EDE7]">
      {currentPage === "landing" && (
        <Landing
          user={user}
          onLogin={handleLogin}
          onSelectProject={handleSelectProject}
          onCreateProjectFromFrames={handleCreateProjectFromFrames}
          onNavigateTo={setCurrentPage}
        />
      )}

      {currentPage === "editor" && activeProject && (
        <Editor
          user={user}
          initialProject={activeProject}
          onNavigateHome={() => {
            setActiveProject(null);
            setCurrentPage("landing");
          }}
        />
      )}

      {currentPage === "dashboard" && (
        <Dashboard
          user={user}
          onSelectProject={handleSelectProject}
          onNavigateHome={() => setCurrentPage("landing")}
        />
      )}

      {currentPage === "settings" && (
        <Settings
          user={user}
          onNavigateHome={() => setCurrentPage("landing")}
          accentColor={accentColor}
          setAccentColor={setAccentColor}
          defaultDurationMs={defaultDurationMs}
          setDefaultDurationMs={setDefaultDurationMs}
          defaultFrameCount={defaultFrameCount}
          setDefaultFrameCount={setDefaultFrameCount}
          onLogout={() => {
            localStorage.removeItem("local_guest_user");
            setUser(null);
            setCurrentPage("landing");
            setActiveProject(null);
          }}
        />
      )}

      {/* Google Sign-In Iframe Warning Modal */}
      {showAuthWarning && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-gradient-to-b from-[#241A22] to-[#1C1512] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-[#E8793A] to-yellow-500"></div>
            
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 flex-shrink-0">
                <AlertCircle className="w-5.5 h-5.5" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">Google Sign-In Alert</h3>
            </div>
            
            <div className="space-y-3.5 text-xs text-[#B8ADA3] leading-relaxed mb-6">
              <p>
                You are currently running the app inside an <strong>Iframe Preview</strong>. Web browsers block Google Sign-In popups inside nested sandbox frames.
              </p>
              <div className="text-[#F3EDE7] font-semibold bg-white/[0.03] border border-white/5 p-3 rounded-lg text-xs leading-normal font-sans">
                bhai, popup code browser me block ho gaya hai iframe compatibility ki wajah se. Standalone link me login kijiye!
              </div>
              <p>
                To log in successfully, please click the <strong>"Open in New Tab"</strong> button below to open the standalone app in a separate browser tab, where sign-in is fully supported.
              </p>
            </div>
            
            <div className="flex flex-col space-y-2.5">
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-[#E8793A] hover:bg-[#F2925C] text-[#1C1512] font-bold text-center rounded-xl text-xs transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#E8793A]/10 flex items-center justify-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in New Tab & Sign In</span>
              </a>
              
              <button
                onClick={() => {
                  setShowAuthWarning(false);
                }}
                className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer"
              >
                Continue as Guest / local save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Auth Modal with Local & Google support */}
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onGoogleSignIn={async () => {
            try {
              await signInWithGoogle();
              setShowAuthModal(false);
            } catch (err: any) {
              console.error("Google login error:", err);
              setShowAuthModal(false);
              setShowAuthWarning(true);
            }
          }}
          onGuestSignIn={(name: string) => {
            const guestUser = {
              uid: "guest_" + name.trim().replace(/\s+/g, "_") + "_" + Math.floor(Math.random() * 1000),
              displayName: name.trim(),
              email: "guest_" + name.trim().toLowerCase().replace(/\s+/g, "_") + "@cursorstudio.local",
              photoURL: null
            };
            localStorage.setItem("local_guest_user", JSON.stringify(guestUser));
            setUser(guestUser);
            setShowAuthModal(false);
          }}
        />
      )}

      {/* Global API Key error notification overlay */}
      <AnimatePresence>
        {globalApiError && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
          >
            <div className="bg-gradient-to-r from-[#241A22] to-[#1C1512] border border-red-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              {/* Colored left bar indicator */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 flex-shrink-0">
                  <AlertCircle className="w-5.5 h-5.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-[#E8793A]" />
                    <span>API Authentication Issue</span>
                  </h3>
                  <p className="text-xs text-[#B8ADA3] leading-relaxed mt-1.5 whitespace-pre-line">
                    {globalApiError.message}
                  </p>

                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={() => {
                        setCurrentPage("settings");
                        setGlobalApiError(null);
                      }}
                      className="px-3.5 py-1.5 bg-[#E8793A] hover:bg-[#F2925C] text-[#1C1512] font-bold rounded-lg text-xs transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Configure API Key</span>
                    </button>
                    <button
                      onClick={() => setGlobalApiError(null)}
                      className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setGlobalApiError(null)}
                  className="p-1 rounded-lg hover:bg-white/5 text-[#B8ADA3] hover:text-white transition-colors flex-shrink-0 cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
