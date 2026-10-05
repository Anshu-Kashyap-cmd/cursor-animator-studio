import React, { useState, useEffect } from "react";
import { MousePointer, Images, LayoutGrid, Settings, FileCode, Trash2, Edit3, FolderHeart, Sparkles, Video, Film, PlusCircle } from "lucide-react";
import { UploadZone } from "../components/UploadZone.tsx";
import { GlassPanel } from "../components/GlassPanel.tsx";
import { VideoToFramesExtractorModal } from "../components/VideoToFramesExtractorModal.tsx";
import { CreatorBanner } from "../components/CreatorBanner.tsx";
import { PolicyModal, PolicyTab } from "../components/PolicyModal.tsx";
import { CursorFrame } from "../engine/curParser.ts";
import { ProjectData } from "../types.ts";
import { loadProjectsFromDb, deleteProjectFromDb } from "../db/projects.ts";

interface LandingProps {
  user?: any;
  onLogin?: () => void;
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
  const [mode, setMode] = useState<"auto" | "manual" | "video">("auto");
  const [recentProjects, setRecentProjects] = useState<ProjectData[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Video Extractor Modal state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);

  // Policy Modal state
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [policyModalTab, setPolicyModalTab] = useState<PolicyTab>("privacy");

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
    onCreateProjectFromFrames(frames, fileName, mode === "video" ? "manual" : mode);
  };

  const handleVideoFileSelected = (file: File) => {
    setSelectedVideoFile(file);
    setIsVideoModalOpen(true);
  };

  const handleVideoExtractedFrames = (frames: CursorFrame[], projectName: string) => {
    onCreateProjectFromFrames(frames, projectName, "manual");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-8 px-4 text-[#F3EDE7]">
      {/* Header bar */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between mb-8">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8793A]/20 via-[#1C1512] to-[#6E5A7B]/20 flex items-center justify-center shadow-lg shadow-[#E8793A]/10 border border-[#E8793A]/30 overflow-hidden">
            <img src="/logo.png" alt="Cursor Animator Studio Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-[#F3EDE7] to-[#B8ADA3] bg-clip-text text-transparent">
            Cursor Animator Studio
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigateTo("dashboard")}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-[#6E5A7B]/40 text-xs font-semibold border border-white/5 transition-all cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#E8793A]" />
            <span>My Projects</span>
          </button>
          <button
            onClick={() => onNavigateTo("settings")}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold border border-white/5 transition-all cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>
      </header>

      {/* Main Area */}
      <main className="max-w-4xl mx-auto w-full flex-1 flex flex-col items-center justify-center my-6 space-y-10">
        <div className="text-center space-y-3 max-w-xl">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white to-[#B8ADA3] bg-clip-text text-transparent">
            Animate Windows Cursors
          </h1>
          <p className="text-sm text-[#B8ADA3] leading-relaxed">
            Create premium animated <span className="font-mono text-[#E8793A]">.ani</span> cursor schemes. Procedurally transform static pointers, order custom frames, or extract frames directly from <span className="text-white font-semibold">Video Clips</span>!
          </p>
        </div>

        {/* Upload card panel */}
        <GlassPanel className="w-full max-w-xl p-6" intensity="medium">
          {/* Mode Selector Pill */}
          <div className="flex flex-wrap justify-center gap-1 bg-neutral-950/40 p-1 rounded-xl mb-6 border border-white/5 w-fit mx-auto">
            <button
              onClick={() => setMode("auto")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === "auto"
                  ? "bg-[#E8793A] text-[#1C1512] shadow-md shadow-[#E8793A]/15"
                  : "text-[#B8ADA3] hover:text-white"
              }`}
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span>Auto-Animate</span>
            </button>
            <button
              onClick={() => setMode("manual")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === "manual"
                  ? "bg-[#E8793A] text-[#1C1512] shadow-md shadow-[#E8793A]/15"
                  : "text-[#B8ADA3] hover:text-white"
              }`}
            >
              <Images className="w-3.5 h-3.5" />
              <span>Manual Frames</span>
            </button>
            <button
              onClick={() => {
                setMode("video");
                setIsVideoModalOpen(true);
              }}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === "video"
                  ? "bg-[#E8793A] text-[#1C1512] shadow-md shadow-[#E8793A]/15"
                  : "text-[#B8ADA3] hover:text-white"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video to Cursor 🎥</span>
            </button>
          </div>

          {/* Draggable Drop Upload Zone */}
          <UploadZone 
            mode={mode} 
            onFramesLoaded={handleFramesLoaded} 
            onVideoFileSelected={handleVideoFileSelected}
            onError={showToast} 
            user={user}
            onLogin={onLogin}
          />
        </GlassPanel>

        {/* Video to Cursor Feature Banner */}
        <div className="w-full max-w-xl p-4 rounded-2xl bg-gradient-to-r from-[#E8793A]/10 via-[#1C1512] to-[#6E5A7B]/20 border border-[#E8793A]/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#E8793A]/20 text-[#E8793A] border border-[#E8793A]/30">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                Convert Any Video into Cursor (.ANI)
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#E8793A] text-[#1C1512] font-bold">
                  NEW
                </span>
              </h4>
              <p className="text-[11px] text-[#B8ADA3]">
                Extract video frames, remove backgrounds (Chroma key), and apply color FX.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedVideoFile(null);
              setIsVideoModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#E8793A] hover:bg-[#F2925C] text-[#1C1512] font-bold text-xs transition-all shadow-md shadow-[#E8793A]/15 cursor-pointer whitespace-nowrap"
          >
            Open Video Extractor
          </button>
        </div>

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

                  {/* Delete button always visible and highly clickable */}
                  <button
                    onClick={(e) => handleDeleteProject(e, p.id)}
                    className="absolute top-2.5 right-2.5 z-20 p-2 rounded-lg bg-black/70 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-red-400 hover:text-red-300 transition-all cursor-pointer shadow-md shadow-black/40"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open-Source banner notification */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#E8793A]/10 via-black/40 to-[#6E5A7B]/10 border border-[#E8793A]/25 max-w-xl text-center flex items-center justify-center space-x-2.5 shadow-md">
          <Sparkles className="w-4.5 h-4.5 text-[#E8793A] animate-pulse flex-shrink-0" />
          <p className="text-xs text-[#D6CAC0]">
            <strong className="text-white font-bold">100% Free & Open-Source:</strong> No login or account required! All features and projects auto-save locally to your browser.
          </p>
        </div>
      </main>

      {/* Video Extractor Modal */}
      <VideoToFramesExtractorModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onFramesExtracted={handleVideoExtractedFrames}
        initialFile={selectedVideoFile}
      />

      {/* Creator & Portal Showcase Banner */}
      <section className="max-w-6xl mx-auto w-full px-2">
        <CreatorBanner variant="full" />
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full text-xs text-[#B8ADA3] pt-6 pb-4 border-t border-white/10 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span className="text-[#F3EDE7]">© 2026 Cursor Animator Studio.</span>
            <span className="hidden sm:inline text-white/20">•</span>
            <span className="text-[#D6CAC0]">
              Crafted with passion by{" "}
              <strong className="text-white font-black bg-gradient-to-r from-[#FFA873] to-[#FFD1A4] bg-clip-text text-transparent text-sm tracking-wide px-1">
                Anshu Kashyap
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://aicreation2026.blogspot.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#E8793A]/15 hover:bg-[#E8793A]/30 border border-[#E8793A]/50 text-[#FFA873] hover:text-white font-extrabold text-xs transition-all shadow-sm shadow-[#E8793A]/10"
            >
              <span>aicreation2026.blogspot.com</span>
              <span className="text-[10px]">&rarr;</span>
            </a>
            <span className="font-mono text-[10px] text-neutral-500 hidden md:inline">
              CUR • ICO • ANI
            </span>
          </div>
        </div>

        {/* Security & Legal Links */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 border-t border-white/5 text-[11px] text-[#B8ADA3]">
          <span className="text-neutral-500 font-mono uppercase tracking-wider text-[10px]">Legal & Security:</span>
          <button
            onClick={() => {
              setPolicyModalTab("privacy");
              setIsPolicyModalOpen(true);
            }}
            className="hover:text-[#FFA873] transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>🔒 Privacy Policy</span>
          </button>
          <span className="text-white/10">•</span>
          <button
            onClick={() => {
              setPolicyModalTab("security");
              setIsPolicyModalOpen(true);
            }}
            className="hover:text-[#FFA873] transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>🛡️ Security Architecture</span>
          </button>
          <span className="text-white/10">•</span>
          <button
            onClick={() => {
              setPolicyModalTab("disclaimer");
              setIsPolicyModalOpen(true);
            }}
            className="hover:text-[#FFA873] transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>⚖️ Disclaimer & Terms</span>
          </button>
        </div>
      </footer>

      {/* Policy Modal */}
      <PolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        initialTab={policyModalTab}
      />

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
