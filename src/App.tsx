import React, { useState, useEffect } from "react";
import { ProjectData, ProjectFrame } from "./types.ts";
import { CursorFrame } from "./engine/curParser.ts";
import { Landing } from "./pages/Landing.tsx";
import { Editor } from "./pages/Editor.tsx";
import { Dashboard } from "./pages/Dashboard.tsx";
import { Settings } from "./pages/Settings.tsx";
import { AuthModal } from "./components/AuthModal.tsx";
import { auth, signInWithGoogle, signOut } from "./db/firebase.ts";
import { onAuthStateChanged } from "firebase/auth";
import { AlertCircle, Settings as SettingsIcon, X, Key } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [currentPage, setCurrentPage] = useState<"landing" | "editor" | "dashboard" | "settings">("landing");
  const [user, setUser] = useState<any>(() => auth.currentUser);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Global settings
  const [accentColor, setAccentColor] = useState<string>("#E8793A");
  const [defaultDurationMs, setDefaultDurationMs] = useState<number>(5500);
  const [defaultFrameCount, setDefaultFrameCount] = useState<number>(18);

  const [activeProject, setActiveProject] = useState<ProjectData | null>(null);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

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

  // Update root element custom CSS variables based on accentColor
  useEffect(() => {
    document.documentElement.style.setProperty("--accent-orange", accentColor);
    // Darken/hover version of accent
    const hoverColor = accentColor === "#E8793A" ? "#F2925C" : `${accentColor}cc`;
    document.documentElement.style.setProperty("--accent-orange-hover", hoverColor);
  }, [accentColor]);

  const handleGoogleSignIn = async () => {
    try {
      const loggedUser = await signInWithGoogle();
      setUser(loggedUser);
      setIsAuthModalOpen(false);
    } catch (err) {
      console.error("Google sign in error:", err);
      throw err;
    }
  };

  const handleGuestSignIn = (name: string) => {
    const guestUser = {
      uid: `guest_${Date.now()}`,
      displayName: name,
      email: `${name.toLowerCase().replace(/\s+/g, "")}@guest.local`,
      photoURL: null,
    };
    setUser(guestUser);
    setIsAuthModalOpen(false);
  };

  const handleSignOut = async () => {
    try {
      if (user?.uid && !user.uid.startsWith("guest_") && user.uid !== "local_user") {
        await signOut();
      }
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setUser(null);
      setActiveProject(null);
      setCurrentPage("landing");
    }
  };

  const handleSelectProject = (project: ProjectData) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setActiveProject(project);
    setCurrentPage("editor");
  };

  const handleCreateProjectFromFrames = (frames: CursorFrame[], name: string, mode: "auto" | "manual") => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

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
      user_id: user?.uid || "google_user",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1C1512] via-[#20171B] to-[#241A22] font-sans antialiased text-[#F3EDE7]">
      {currentPage === "landing" && (
        <Landing
          user={user}
          onLogin={() => setIsAuthModalOpen(true)}
          onLogout={handleSignOut}
          onSelectProject={handleSelectProject}
          onCreateProjectFromFrames={handleCreateProjectFromFrames}
          onNavigateTo={(page) => {
            if (page === "dashboard" && !user) {
              setIsAuthModalOpen(true);
              return;
            }
            setCurrentPage(page);
          }}
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
          onLogout={handleSignOut}
        />
      )}

      {/* Auth Modal for Google Sign In */}
      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onGoogleSignIn={handleGoogleSignIn}
          onGuestSignIn={handleGuestSignIn}
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
                      <SettingsIcon className="w-3.5 h-3.5" />
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
