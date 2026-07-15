import React, { useState, useRef } from "react";
import { Upload, MousePointer, Image as ImageIcon, AlertCircle } from "lucide-react";
import { parseCurFile, CursorFrame } from "../engine/curParser.ts";

interface UploadZoneProps {
  mode: "auto" | "manual";
  onFramesLoaded: (frames: CursorFrame[], fileName: string) => void;
  onError: (msg: string) => void;
  user: any;
  onLogin: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ 
  mode, 
  onFramesLoaded, 
  onError,
  user,
  onLogin
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDeveloper = (u: any) => {
    if (u?.email === "mehraansh023@gmail.com") return true;
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname === "localhost" || hostname.includes("ais-dev") || hostname.includes("127.0.0.1")) {
        return true;
      }
    }
    return false;
  };

  const isDev = isDeveloper(user);
  const isLoggedInRealUser = user !== null && !user.uid.startsWith("guest_");
  const isRestricted = !isDev && !isLoggedInRealUser;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFiles = async (files: FileList) => {
    if (files.length === 0) return;
    setIsLoading(true);

    try {
      if (mode === "auto") {
        // Auto-animate expects exactly 1 file (.cur or .ico)
        const file = files[0];
        const isCur = file.name.endsWith(".cur");
        const isIco = file.name.endsWith(".ico");

        if (!isCur && !isIco) {
          throw new Error("Invalid file format. Please upload a .cur or .ico file for Auto-Animate mode.");
        }

        const buffer = await file.arrayBuffer();
        const frames = await parseCurFile(buffer);
        onFramesLoaded(frames, file.name.replace(/\.[^/.]+$/, ""));
      } else {
        // Manual mode can take multiple .cur files
        const sortedFiles = Array.from(files).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        const allLoadedFrames: CursorFrame[] = [];
        let firstDimensions: { width: number; height: number } | null = null;
        let showSizeWarning = false;

        for (const file of sortedFiles) {
          if (!file.name.endsWith(".cur") && !file.name.endsWith(".ico")) {
            continue;
          }
          const buffer = await file.arrayBuffer();
          const parsed = await parseCurFile(buffer);

          for (const frame of parsed) {
            if (!firstDimensions) {
              firstDimensions = { width: frame.width, height: frame.height };
            } else if (frame.width !== firstDimensions.width || frame.height !== firstDimensions.height) {
              showSizeWarning = true;
              // Resize image data to match first frame using an offscreen canvas
              const resizedFrame = resizeFrameToMatch(frame, firstDimensions.width, firstDimensions.height);
              allLoadedFrames.push(resizedFrame);
              continue;
            }
            allLoadedFrames.push(frame);
          }
        }

        if (allLoadedFrames.length === 0) {
          throw new Error("No valid .cur or .ico files were uploaded.");
        }

        if (showSizeWarning && firstDimensions) {
          onError(`Mismatched frame sizes detected. Auto-resized all frames to match the first frame (${firstDimensions.width}x${firstDimensions.height}).`);
        }

        onFramesLoaded(allLoadedFrames, sortedFiles[0].name.replace(/\.[^/.]+$/, "") + "_animated");
      }
    } catch (err: any) {
      console.error(err);
      onError(err.message || "Failed to parse files.");
    } finally {
      setIsLoading(false);
      setIsDragActive(false);
    }
  };

  const resizeFrameToMatch = (frame: CursorFrame, targetWidth: number, targetHeight: number): CursorFrame => {
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Put the original image data onto an offscreen canvas of the original size first
      const srcCanvas = document.createElement("canvas");
      srcCanvas.width = frame.width;
      srcCanvas.height = frame.height;
      const srcCtx = srcCanvas.getContext("2d");
      if (srcCtx) {
        srcCtx.putImageData(frame.imageData, 0, 0);
        // Draw with stretching/resizing
        ctx.drawImage(srcCanvas, 0, 0, targetWidth, targetHeight);
      }
    }

    const newImageData = ctx ? ctx.getImageData(0, 0, targetWidth, targetHeight) : frame.imageData;
    const newDataUrl = canvas.toDataURL("image/png");

    return {
      ...frame,
      width: targetWidth,
      height: targetHeight,
      // Scale hotspot proportionally
      hotspotX: Math.round((frame.hotspotX / frame.width) * targetWidth),
      hotspotY: Math.round((frame.hotspotY / frame.height) * targetHeight),
      imageData: newImageData,
      dataUrl: newDataUrl,
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (isRestricted) {
      onError("🔒 Custom image uploads are restricted to logged-in accounts. Please sign in with Google or Email to create your custom animated cursors!");
      onLogin();
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (isRestricted) {
      onError("🔒 Custom image uploads are restricted to logged-in accounts. Please sign in with Google or Email to create your custom animated cursors!");
      onLogin();
      return;
    }
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const onButtonClick = (e: React.MouseEvent) => {
    if (isRestricted) {
      e.preventDefault();
      e.stopPropagation();
      onError("🔒 Custom image uploads are restricted to logged-in accounts. Please sign in with Google or Email to create your custom animated cursors!");
      onLogin();
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
      className={`relative group flex flex-col items-center justify-center w-full min-h-[300px] p-8 border-2 border-dashed rounded-[20px] transition-all cursor-pointer select-none overflow-hidden ${
        isDragActive
          ? "border-[#E8793A] bg-white/[0.06] scale-[1.01]"
          : "border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.04]"
      }`}
      style={{
        boxShadow: isDragActive ? "0 0 32px rgba(232, 121, 58, 0.15)" : "none",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple={mode === "manual"}
        accept=".cur,.ico"
        onChange={handleChange}
        className="hidden"
      />

      {isLoading ? (
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#E8793A] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-[#F3EDE7] animate-pulse">Parsing cursor bytes...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center space-y-5">
          <div className="relative p-5 rounded-full bg-white/[0.04] group-hover:bg-white/[0.08] transition-all group-hover:scale-110 duration-300">
            {mode === "auto" ? (
              <MousePointer className="w-10 h-10 text-[#E8793A] stroke-[1.5]" />
            ) : (
              <ImageIcon className="w-10 h-10 text-[#E8793A] stroke-[1.5]" />
            )}
            <div className="absolute -top-1 -right-1 bg-[#E8793A] rounded-full p-1 shadow-md shadow-black/50">
              <Upload className="w-3 h-3 text-[#1C1512]" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-[#F3EDE7]">
              {mode === "auto"
                ? "Upload static cursor to animate"
                : "Upload multiple frames"}
            </h3>
            <p className="text-sm text-[#B8ADA3] max-w-sm">
              {mode === "auto"
                ? "Drag & drop a single .cur or .ico file, or click to browse. We will procedurally generate looping animations."
                : "Select multiple .cur files (or drag a collection). We will assemble them into an ordered timeline."}
            </p>
          </div>

          <div className="px-4 py-2 text-xs font-mono font-medium rounded-full bg-[#6E5A7B]/40 border border-[#6E5A7B]/40 text-[#B8ADA3] group-hover:text-[#F3EDE7] transition-colors">
            {mode === "auto" ? "Accepts CUR / ICO (single)" : "Accepts multiple CUR / ICO"}
          </div>
        </div>
      )}

      {/* Grid subtle accent highlights */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-[#E8793A]/5 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#6E5A7B]/10 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
};
