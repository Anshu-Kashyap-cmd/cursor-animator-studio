import React, { useState, useEffect } from "react";
import { MousePointer, Images, LogIn, LayoutGrid, Settings, FileCode, Trash2, Edit3, FolderHeart, Sparkles } from "lucide-react";
import { UploadZone } from "../components/UploadZone.tsx";
import { GlassPanel } from "../components/GlassPanel.tsx";
import { CursorFrame } from "../engine/curParser.ts";
import { ProjectData } from "../types.ts";
import { loadProjectsFromDb, deleteProjectFromDb } from "../db/projects.ts";
import { User } from "firebase/auth";

interface LandingProps {
  user: User | null;
  onLogin: () => void;
  onSelectProject: (project: ProjectData) => void;
  onCreateProjectFromFrames: (frames: CursorFrame[], name: string, mode: "auto" | "manual") => void;
  onNavigateTo: (page: "landing" | "editor" | "dashboard" | "settings") => void;
}

export const Landing: React.FC<LandingProps> = ({
  user,
  onLogin,
  onSelectProject,
  onCreateProjectFromFrames,
  onNavigateTo,
}) => {
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [recentProjects, setRecentProjects] = useState<ProjectData[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecent = async () => {
      const projects = await loadProjectsFromDb(user?.uid);
      setRecentProjects(projects.slice(0, 4)); // Get last 4 projects
    };
    fetchRecent();
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleDeleteProject = async (e: React.MouseEvent, projId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project?")) {
      await deleteProjectFromDb(projId, user?.uid);
      setRecentProjects((prev) => prev.filter((p) => p.id !== projId));
      showToast("Deleted project successfully.");
    }
  };

  const handleFramesLoaded = (frames: CursorFrame[], fileName: string) => {
    onCreateProjectFromFrames(frames, fileName, mode);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-8 px-4 text-[#F3EDE7]">
      {/* Header bar */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between mb-8">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8793A]/20 via-[#1C1512] to-[#6E5A7B]/20 flex items-center justify-center shadow-lg shadow-[#E8793A]/10 border border-[#E8793A]/30 overflow-hidden">
            <img src="logo.png" alt="Cursor Animator Studio Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-[#F3EDE7] to-[#B8ADA3] bg-clip-text text-transparent">
            Cursor Animator Studio
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {user ? (
            <>
              <button
                onClick={() => onNavigateTo("dashboard")}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-[#6E5A7B]/40 text-xs font-semibold border border-white/5 transition-all cursor-pointer"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[#E8793A]" />
                <span>My Dashboard</span>
              </button>
              <button
                onClick={() => onNavigateTo("settings")}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold border border-white/5 transition-all cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
              <div className="flex items-center space-x-2 pl-2 border-l border-white/10">
                <img
                  src={user.photoURL || "https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_512dp.png"}
                  alt={user.displayName || "User"}
                  className="w-7 h-7 rounded-full border border-white/10"
                />
              </div>
            </>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#E8793A] hover:bg-[#F2925C] text-[#1C1512] text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-md shadow-[#E8793A]/10 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In with Google</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Area */}
      <main className="max-w-4xl mx-auto w-full flex-1 flex flex-col items-center justify-center my-6 space-y-10">
        <div className="text-center space-y-3 max-w-xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white to-[#B8ADA3] bg-clip-text text-transparent">
            Animate Windows Cursors
          </h1>
          <p className="text-sm text-[#B8ADA3] leading-relaxed">
            Create premium animated <span className="font-mono text-[#E8793A]">.ani</span> cursor schemes. Procedurally transform static pointers or order custom frames. Pure client-side binary compiler.
          </p>
        </div>

        {/* Upload card panel */}
        <GlassPanel className="w-full max-w-xl p-6" intensity="medium">
          {/* Mode Selector Pill */}
          <div className="flex bg-neutral-950/40 p-1 rounded-xl mb-6 border border-white/5 w-fit mx-auto">
            <button
              onClick={() => setMode("auto")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === "auto"
                  ? "bg-[#E8793A] text-[#1C1512] shadow-md shadow-[#E8793A]/15"
                  : "text-[#B8ADA3] hover:text-white"
              }`}
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span>Auto-Animate (Single File)</span>
            </button>
            <button
              onClick={() => setMode("manual")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === "manual"
                  ? "bg-[#E8793A] text-[#1C1512] shadow-md shadow-[#E8793A]/15"
                  : "text-[#B8ADA3] hover:text-white"
              }`}
            >
              <Images className="w-3.5 h-3.5" />
              <span>Manual Frames (Ordered)</span>
            </button>
          </div>

          {/* Draggable Drop Upload Zone */}
          <UploadZone 
            mode={mode} 
            onFramesLoaded={handleFramesLoaded} 
            onError={showToast} 
            user={user}
            onLogin={onLogin}
          />
        </GlassPanel>

        {/* Recent projects carousel */}
        {recentProjects.length > 0 && (
          <div className="w-full max-w-3xl space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#B8ADA3] uppercase tracking-wider pl-1">
              <FolderHeart className="w-4 h-4 text-[#E8793A]" />
              <span>Recent Projects</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectProject(p)}
                  className="group relative p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#E8793A] hover:bg-white/[0.04] transition-all cursor-pointer select-none overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div className="w-full aspect-square rounded-lg bg-neutral-950/40 flex items-center justify-center p-3 mb-3 border border-white/5 relative">
                    {/* Checkerboard */}
                    <div className="absolute inset-0 bg-neutral-950/10 pointer-events-none" style={{
                      backgroundImage: "linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)",
                      backgroundSize: "4px 4px",
                    }} />
                    {p.frames[0]?.image_data ? (
                      <img
                        src={p.frames[0].image_data}
                        alt={p.name}
                        className="w-10 h-10 object-contain relative z-10 select-none pointer-events-none transform group-hover:scale-110 duration-200"
                      />
                    ) : (
                      <MousePointer className="w-6 h-6 text-neutral-600 relative z-10" />
                    )}

                    {/* Mode tag */}
                    <span className="absolute bottom-1.5 right-1.5 text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-black/60 text-[#B8ADA3]">
                      {p.mode}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-[#F3EDE7] truncate group-hover:text-[#E8793A] transition-colors">
                    {p.name}
                  </h3>
                  
                  <div className="flex items-center justify-between mt-1 text-[10px] text-[#B8ADA3] font-mono">
                    <span>{p.frames.length} frames</span>
                    <span>{(p.total_duration_ms / 1000).toFixed(1)}s</span>
                  </div>

                  {/* Delete button hover overlay */}
                  <button
                    onClick={(e) => handleDeleteProject(e, p.id)}
                    className="absolute top-2 right-2 p-1.5 rounded bg-black/80 hover:bg-red-500/10 text-[#B8ADA3] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity border border-white/5 cursor-pointer"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offline banner notification */}
        {!user && (
          <div className="p-3.5 rounded-xl bg-[#6E5A7B]/10 border border-[#6E5A7B]/20 max-w-lg text-center flex items-center justify-center space-x-2">
            <Sparkles className="w-4.5 h-4.5 text-[#E8793A] animate-pulse" />
            <p className="text-xs text-[#B8ADA3]">
              You are editing in guest mode. Drafts will save locally in your browser. <button onClick={onLogin} className="text-[#E8793A] font-bold underline hover:text-[#F2925C] cursor-pointer">Sign in</button> to enable persistent cloud sync!
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-[#B8ADA3] pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 Cursor Animator Studio. Handcrafted offline-first compiler.</p>
        <p className="font-mono text-[10px] text-neutral-500">
          Support formats: Windows CUR, ICO, ANI (RIFF/ACON)
        </p>
      </footer>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 p-4 rounded-xl bg-neutral-900 border border-white/10 text-xs font-medium text-[#F3EDE7] shadow-xl max-w-sm flex items-center space-x-2">
          <div className="p-1 rounded-full bg-[#E8793A]/10 text-[#E8793A]">
            <MousePointer className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
