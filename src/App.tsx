import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, signInWithGoogle } from "./db/firebase.ts";
import { ProjectData, ProjectFrame } from "./types.ts";
import { CursorFrame } from "./engine/curParser.ts";
import { Landing } from "./pages/Landing.tsx";
import { Editor } from "./pages/Editor.tsx";
import { Dashboard } from "./pages/Dashboard.tsx";
import { Settings } from "./pages/Settings.tsx";

export default function App() {
  const [currentPage, setCurrentPage] = useState<"landing" | "editor" | "dashboard" | "settings">("landing");
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Global settings
  const [accentColor, setAccentColor] = useState<string>("#E8793A");
  const [defaultDurationMs, setDefaultDurationMs] = useState<number>(5500);
  const [defaultFrameCount, setDefaultFrameCount] = useState<number>(18);

  const [activeProject, setActiveProject] = useState<ProjectData | null>(null);

  // Listen to Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
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

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Sign-in trigger error:", err);
    }
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
            setCurrentPage("landing");
            setActiveProject(null);
          }}
        />
      )}
    </div>
  );
}
