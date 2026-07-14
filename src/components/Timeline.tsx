import React, { useState } from "react";
import { Plus, Trash2, Copy, MoveLeft, MoveRight, Download } from "lucide-react";
import { ProjectFrame } from "../types.ts";

interface TimelineProps {
  frames: ProjectFrame[];
  activeFrameIndex: number;
  onActiveFrameChanged: (index: number) => void;
  onFramesUpdated: (frames: ProjectFrame[]) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  frames,
  activeFrameIndex,
  onActiveFrameChanged,
  onFramesUpdated,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Set transparent image for default drag preview if needed or use default
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Rearrange frames array
    const updated = [...frames];
    const [draggedFrame] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedFrame);

    // Re-index frame indices
    const reindexed = updated.map((f, i) => ({
      ...f,
      frame_index: i,
    }));

    onFramesUpdated(reindexed);
    setDraggedIndex(index);
    onActiveFrameChanged(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDeleteFrame = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (frames.length <= 1) return; // Cannot delete last frame

    const updated = frames.filter((_, i) => i !== index);
    const reindexed = updated.map((f, i) => ({
      ...f,
      frame_index: i,
    }));

    onFramesUpdated(reindexed);

    // Adjust active index
    if (activeFrameIndex >= reindexed.length) {
      onActiveFrameChanged(reindexed.length - 1);
    } else if (activeFrameIndex === index) {
      onActiveFrameChanged(Math.max(0, index - 1));
    }
  };

  const handleDuplicateFrame = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const frameToCopy = frames[index];
    if (!frameToCopy) return;

    const newFrame: ProjectFrame = {
      ...frameToCopy,
      frame_index: index + 1,
    };

    const updated = [...frames];
    updated.splice(index + 1, 0, newFrame);

    // Reindex
    const reindexed = updated.map((f, i) => ({
      ...f,
      frame_index: i,
    }));

    onFramesUpdated(reindexed);
    onActiveFrameChanged(index + 1);
  };

  const handleAddBlankFrame = () => {
    const activeFrame = frames[activeFrameIndex];
    if (!activeFrame) return;

    // Create a blank/transparent canvas image
    const canvas = document.createElement("canvas");
    canvas.width = activeFrame.width;
    canvas.height = activeFrame.height;
    const blankDataUrl = canvas.toDataURL("image/png");

    const newFrame: ProjectFrame = {
      frame_index: activeFrameIndex + 1,
      duration_ms: activeFrame.duration_ms,
      width: activeFrame.width,
      height: activeFrame.height,
      hotspot_x: Math.floor(activeFrame.width / 2),
      hotspot_y: Math.floor(activeFrame.height / 2),
      image_data: blankDataUrl,
    };

    const updated = [...frames];
    updated.splice(activeFrameIndex + 1, 0, newFrame);

    const reindexed = updated.map((f, i) => ({
      ...f,
      frame_index: i,
    }));

    onFramesUpdated(reindexed);
    onActiveFrameChanged(activeFrameIndex + 1);
  };

  const handleExportFramePng = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const frame = frames[index];
    if (!frame) return;

    const link = document.createElement("a");
    link.href = frame.image_data;
    link.download = `frame_${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col space-y-3 w-full p-4 rounded-2xl bg-white/[0.02] border border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-[#F3EDE7]">Animation Timeline</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-[#B8ADA3]">
            {frames.length} frames
          </span>
        </div>

        <button
          onClick={handleAddBlankFrame}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 text-xs text-[#F3EDE7] font-medium hover:text-[#E8793A] transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Insert Blank Frame</span>
        </button>
      </div>

      {/* Timeline Strip */}
      <div className="flex items-center space-x-3 overflow-x-auto py-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {frames.map((frame, index) => {
          const isActive = index === activeFrameIndex;
          const isDraggingThis = index === draggedIndex;

          return (
            <div
              key={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => onActiveFrameChanged(index)}
              className={`relative flex-shrink-0 flex flex-col items-center p-2 rounded-xl border transition-all cursor-grab select-none group ${
                isActive
                  ? "border-[#E8793A] bg-white/[0.06] scale-105 shadow-[0_0_15px_rgba(232,121,58,0.2)]"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
              } ${isDraggingThis ? "opacity-40 rotate-2 shadow-[0_10px_20px_rgba(110,90,123,0.3)] cursor-grabbing" : ""}`}
            >
              {/* Index indicator */}
              <div className={`absolute top-1 left-1.5 text-[9px] font-mono font-bold leading-none ${isActive ? "text-[#E8793A]" : "text-[#B8ADA3]"}`}>
                {index + 1}
              </div>

              {/* Frame image box */}
              <div className="w-14 h-14 rounded-lg bg-[#151515] border border-white/5 flex items-center justify-center p-1 overflow-hidden relative mt-1 select-none">
                {/* Checkerboard inside thumbnail */}
                <div className="absolute inset-0 bg-neutral-950/20 select-none pointer-events-none" style={{
                  backgroundImage: "linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)",
                  backgroundSize: "6px 6px",
                  backgroundPosition: "0 0, 0 3px, 3px -3px, -3px 0px"
                }} />
                
                <img
                  src={frame.image_data}
                  alt={`Frame ${index}`}
                  className="w-10 h-10 object-contain relative z-10 select-none pointer-events-none image-render-pixelated"
                />
              </div>

              {/* Duration info */}
              <div className="text-[10px] font-mono text-[#B8ADA3] mt-2 font-semibold">
                {frame.duration_ms}ms
              </div>

              {/* Hover actions menu */}
              <div className="absolute top-1 right-1 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 rounded p-1">
                <button
                  onClick={(e) => handleExportFramePng(e, index)}
                  className="text-[#B8ADA3] hover:text-[#E8793A] transition-colors p-0.5 cursor-pointer"
                  title="Export Frame as PNG"
                >
                  <Download className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => handleDuplicateFrame(e, index)}
                  className="text-[#B8ADA3] hover:text-[#E8793A] transition-colors p-0.5 cursor-pointer"
                  title="Duplicate Frame"
                >
                  <Copy className="w-3 h-3" />
                </button>
                {frames.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteFrame(e, index)}
                    className="text-[#B8ADA3] hover:text-red-400 transition-colors p-0.5 cursor-pointer"
                    title="Delete Frame"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Append button */}
        <button
          onClick={handleAddBlankFrame}
          className="flex-shrink-0 w-16 h-20 rounded-xl border border-dashed border-white/10 hover:border-[#E8793A] bg-white/[0.01] hover:bg-white/[0.03] flex flex-col items-center justify-center text-[#B8ADA3] hover:text-[#E8793A] transition-all cursor-pointer group"
          title="Append duplicated frame"
        >
          <Plus className="w-5 h-5 mb-1 group-hover:scale-110 duration-200" />
          <span className="text-[9px] font-bold tracking-tight">Add Frame</span>
        </button>
      </div>

      <p className="text-[10px] text-[#B8ADA3] flex items-center gap-1 font-medium italic">
        <MoveLeft className="w-3 h-3" />
        <MoveRight className="w-3 h-3" />
        Tip: You can reorder frames by dragging and dropping them left/right.
      </p>
    </div>
  );
};
