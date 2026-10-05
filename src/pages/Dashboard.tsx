import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, SlidersHorizontal, MousePointer, Trash2, Edit3, Copy, RefreshCw, Clock, HardDriveDownload, Sparkles, FolderPlus } from "lucide-react";
import { GlassPanel } from "../components/GlassPanel.tsx";
import { CreatorBanner } from "../components/CreatorBanner.tsx";
import { ProjectData, ExportHistoryEntry } from "../types.ts";
import { loadProjectsFromDb, deleteProjectFromDb, saveProjectToDb, loadExportHistory } from "../db/projects.ts";

interface DashboardProps {
  user?: any;
  onSelectProject: (project: ProjectData) => void;
  onNavigateHome: () => void;
}

/**
 * Self-animating card thumbnail
 */
const AnimatedProjectThumbnail: React.FC<{ project: ProjectData }> = ({ project }) => {
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);

  useEffect(() => {
    if (project.frames.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentFrameIdx((prev) => (prev + 1) % project.frames.length);
    }, project.frames[currentFrameIdx]?.duration_ms || 300);

    return () => clearInterval(interval);
  }, [project, currentFrameIdx]);

  const activeFrame = project.frames[currentFrameIdx] || project.frames[0];

  return (
    <div className="w-full aspect-square rounded-lg bg-neutral-950/40 flex items-center justify-center p-3 mb-3 border border-white/5 relative">
      {/* Checkerboard */}
      <div className="absolute inset-0 bg-neutral-950/10 pointer-events-none" style={{
        backgroundImage: "linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)",
        backgroundSize: "4px 4px",
      }} />
      {activeFrame ? (
        <img
          src={activeFrame.image_data}
          alt={project.name}
          className="w-10 h-10 object-contain relative z-10 select-none pointer-events-none transform scale-110"
        />
      ) : (
        <MousePointer className="w-6 h-6 text-neutral-600 relative z-10" />
      )}
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ user, onSelectProject, onNavigateHome }) => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [exportHistory, setExportHistory] = useState<ExportHistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "duration">("recent");
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    const projs = await loadProjectsFromDb(user?.uid);
    const history = await loadExportHistory(user?.uid);
    setProjects(projs);
    setExportHistory(history);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDelete = async (e: React.MouseEvent, projId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to permanently delete this project?")) {
      await deleteProjectFromDb(projId, user?.uid);
      setProjects((prev) => prev.filter((p) => p.id !== projId));
      showToast("Project deleted successfully.");
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, original: ProjectData) => {
    e.stopPropagation();
    const duplicated: ProjectData = {
      ...original,
      id: Math.random().toString(36).substring(2, 9),
      name: `${original.name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await saveProjectToDb(duplicated, user?.uid);
    setProjects((prev) => [duplicated, ...prev]);
    showToast("Project duplicated successfully.");
  };

  const handleRename = async (e: React.MouseEvent, proj: ProjectData) => {
    e.stopPropagation();
    const newName = prompt("Enter new name for project:", proj.name);
    if (newName && newName.trim()) {
      const updated = {
        ...proj,
        name: newName.trim(),
        updated_at: new Date().toISOString(),
      };
      await saveProjectToDb(updated, user?.uid);
      setProjects((prev) => prev.map((p) => (p.id === proj.id ? updated : p)));
      showToast("Project renamed successfully.");
    }
  };

  const handleRedownload = (entry: ExportHistoryEntry) => {
    // Re-download is triggered by converting the image_data thumbnail or stored project data
    // For local logs, we can just trigger a download of the active image data or re-route user to editor
    showToast("Opening editor to compile file...");
    // Fetch project
    const foundProj = projects.find((p) => p.id === entry.project_id);
    if (foundProj) {
      onSelectProject(foundProj);
    } else {
      showToast("Original project file not found.");
    }
  };

  // Filter & Sort logic
  const filteredProjects = projects
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "duration") {
        return b.total_duration_ms - a.total_duration_ms;
      } else {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

  return (
    <div className="min-h-screen flex flex-col bg-[#1C1512] text-[#F3EDE7] py-8 px-6">
      {/* Header bar */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <button
            onClick={onNavigateHome}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#B8ADA3] hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-white/10"></div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2A1810] via-[#1C1512] to-[#2E1838] flex items-center justify-center border border-[#E8793A]/40 overflow-hidden shrink-0 shadow-md shadow-[#E8793A]/10">
            <img src="/logo.png" alt="Cursor Animator Studio Logo" className="w-full h-full object-contain p-0.5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-[#B8ADA3] bg-clip-text text-transparent">
            My Cursors Dashboard
          </h1>
        </div>

        <div className="text-xs text-[#B8ADA3] font-mono">
          Workspace: <span className="text-[#E8793A] font-bold">{user?.email || "Local Storage (100% Offline)"}</span>
        </div>
      </header>

      {/* Main split */}
      <main className="max-w-6xl mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Projects Grid Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by name..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-black/40 border border-white/5 text-sm text-[#F3EDE7] focus:border-[#E8793A] focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-3 text-xs text-[#B8ADA3]">
              <div className="flex items-center space-x-1.5 font-semibold">
                <SlidersHorizontal className="w-4 h-4 text-[#E8793A]" />
                <span>Sort by:</span>
              </div>
              <div className="flex bg-neutral-950/40 p-0.5 rounded-lg border border-white/5">
                {[
                  { id: "recent", label: "Recent" },
                  { id: "name", label: "Name" },
                  { id: "duration", label: "Length" }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSortBy(s.id as any)}
                    className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                      sortBy === s.id
                        ? "bg-[#6E5A7B]/40 text-white"
                        : "text-[#B8ADA3] hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid list */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-[#E8793A] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-[#B8ADA3]">Loading your saved cursor projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-24 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4">
              <MousePointer className="w-12 h-12 mx-auto text-neutral-600 animate-pulse" />
              <div className="space-y-1">
                <h3 className="font-bold text-[#F3EDE7]">No cursor projects found</h3>
                <p className="text-sm text-[#B8ADA3] max-w-sm mx-auto">
                  {searchQuery ? "No projects match your search query. Try another keyword!" : "You haven't compiled any custom cursors yet! Go back home to upload and animate your first project."}
                </p>
              </div>
              {!searchQuery && (
                <button
                  onClick={onNavigateHome}
                  className="px-4 py-2 rounded-lg bg-[#E8793A] hover:bg-[#F2925C] text-[#1C1512] font-bold text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Create New Project
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectProject(p)}
                  className="group relative p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#E8793A] hover:bg-white/[0.04] transition-all cursor-pointer select-none overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Auto playing thumbnail */}
                    <AnimatedProjectThumbnail project={p} />

                    <h3 className="text-sm font-bold text-[#F3EDE7] truncate group-hover:text-[#E8793A] transition-colors mb-1">
                      {p.name}
                    </h3>

                    <div className="flex items-center space-x-2 text-[11px] font-mono text-[#B8ADA3]">
                      <span className="uppercase bg-black/40 px-1.5 py-0.5 rounded text-[9px] text-[#E8793A] border border-[#E8793A]/10 font-bold">
                        {p.mode}
                      </span>
                      <span>•</span>
                      <span>{p.frames.length} frames</span>
                      <span>•</span>
                      <span>{(p.total_duration_ms / 1000).toFixed(1)}s</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                    <span>Edited: {new Date(p.updated_at).toLocaleDateString()}</span>
                    
                    {/* Inline actions menu */}
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={(e) => handleRename(e, p)}
                        className="p-1 rounded hover:bg-white/5 text-[#B8ADA3] hover:text-white cursor-pointer"
                        title="Rename"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDuplicate(e, p)}
                        className="p-1 rounded hover:bg-white/5 text-[#B8ADA3] hover:text-white cursor-pointer"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, p)}
                        className="p-1 rounded hover:bg-white/5 text-[#B8ADA3] hover:text-red-400 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export History Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center space-x-2 text-[#F3EDE7]">
              <HardDriveDownload className="w-4.5 h-4.5 text-[#E8793A]" />
              <h3 className="font-bold text-sm tracking-tight">Recent Exports Log</h3>
            </div>
            
            <div className="h-px bg-white/10 w-full"></div>

            {exportHistory.length === 0 ? (
              <p className="text-xs text-[#B8ADA3] italic text-center py-6">
                No exports have been logged for this account yet.
              </p>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {exportHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-lg bg-black/20 border border-white/5 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="truncate pr-2">
                        <span className="font-bold text-[#F3EDE7] block truncate">{entry.project_name}</span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          {new Date(entry.exported_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/5 font-mono text-[9px] uppercase font-bold text-[#E8793A]">
                        .{entry.exported_format}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#B8ADA3] font-mono">
                      <span>{(entry.file_size_bytes / 1024).toFixed(1)} KB</span>
                      <button
                        onClick={() => handleRedownload(entry)}
                        className="flex items-center space-x-0.5 text-[#E8793A] hover:underline cursor-pointer font-bold"
                      >
                        <span>Re-export</span>
                        <RefreshCw className="w-2.5 h-2.5 ml-0.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Creator Credit Banner */}
        <div className="mt-8">
          <CreatorBanner variant="compact" />
        </div>
      </main>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 p-4 rounded-xl bg-neutral-900 border border-white/10 text-xs font-semibold text-[#F3EDE7] shadow-2xl">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
