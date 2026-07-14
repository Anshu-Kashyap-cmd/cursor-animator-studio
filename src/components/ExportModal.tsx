import React, { useState, useEffect } from "react";
import {
  X,
  FileDown,
  Check,
  Copy as CopyIcon,
  Monitor,
  Settings2,
  Clock,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Sliders,
  Cpu,
  Layers,
  Activity,
  Info,
  Code
} from "lucide-react";
import { GlassPanel } from "./GlassPanel.tsx";
import { ProjectFrame } from "../types.ts";
import { writeCurFile } from "../engine/curWriter.ts";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (
    format: "ani" | "cur" | "gif" | "zip",
    selectedFrameIndices?: number[],
    customDelayOverrideMs?: number | null,
    bitDepth?: "32" | "24" | "8"
  ) => Promise<{ fileName: string; sizeBytes: number; durationMs: number }>;
  activeFrameIndex: number;
  frames: ProjectFrame[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onDownload,
  activeFrameIndex,
  frames,
}) => {
  const [format, setFormat] = useState<"ani" | "cur" | "gif" | "zip" | "css">("ani");
  const [bitDepth, setBitDepth] = useState<"32" | "24" | "8">("32");
  const [isCopied, setIsCopied] = useState(false);
  const [isCssCopied, setIsCssCopied] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [exportDetails, setExportDetails] = useState<{
    fileName: string;
    sizeBytes: number;
    durationMs: number;
  } | null>(null);
  const [showGuide, setShowGuide] = useState(true);

  // Batch Processing selection states
  const [selectedFrameIndices, setSelectedFrameIndices] = useState<number[]>([]);
  const [useCustomDelay, setUseCustomDelay] = useState(false);
  const [customDelayValue, setCustomDelayValue] = useState(100);

  // Synchronized FPS state for Dual Delay Binding
  const [customFps, setCustomFps] = useState(10);

  // CSS format states
  const [selectedCssFrameIndex, setSelectedCssFrameIndex] = useState<number>(activeFrameIndex);
  const [includeGlobal, setIncludeGlobal] = useState(false);

  // Initialize/Reset frames when modal opens
  useEffect(() => {
    if (isOpen && frames) {
      setSelectedFrameIndices(frames.map((_, idx) => idx));
      setSelectedCssFrameIndex(activeFrameIndex);
    }
    setExportDetails(null);
  }, [isOpen, frames, activeFrameIndex]);

  // Synchronize Custom Delay with Custom FPS
  const handleFpsChange = (fps: number) => {
    setCustomFps(fps);
    const ms = Math.max(16, Math.round(1000 / fps));
    setCustomDelayValue(ms);
  };

  const handleDelayChange = (ms: number) => {
    setCustomDelayValue(ms);
    const fps = Math.round(1000 / ms);
    setCustomFps(Math.max(1, Math.min(60, fps)));
  };

  if (!isOpen) return null;

  // Live Metrics Estimator Calculations
  const targetFramesCount = (format === "cur" || format === "css") ? 1 : selectedFrameIndices.length;
  const targetFrames = (format === "cur" || format === "css")
    ? [frames[selectedCssFrameIndex] || frames[0]]
    : selectedFrameIndices.map((idx) => frames[idx]).filter(Boolean);

  const getSelectedCssFrame = () => {
    return frames[selectedCssFrameIndex] || frames[activeFrameIndex] || frames[0];
  };

  const getCssSnippet = (globalScope: boolean = false) => {
    const frame = getSelectedCssFrame();
    if (!frame) return "/* No frame selected */";
    try {
      const curBytes = writeCurFile(
        frame.width,
        frame.height,
        frame.hotspot_x,
        frame.hotspot_y,
        frame.image_data
      );
      const base64Data = bytesToBase64(curBytes);
      
      if (globalScope) {
        return `/* Apply custom cursor globally to the entire website */
html, body {
  cursor: url('data:image/x-icon;base64,${base64Data}') ${frame.hotspot_x} ${frame.hotspot_y}, auto;
}`;
      } else {
        return `/* CSS Class Selector for Custom Cursor */
.custom-cursor {
  cursor: url('data:image/x-icon;base64,${base64Data}') ${frame.hotspot_x} ${frame.hotspot_y}, auto;
}`;
      }
    } catch (err) {
      console.error(err);
      return "/* Error compiling frame into CUR base64 */";
    }
  };

  const calculateEstimate = () => {
    if (targetFrames.length === 0 || !targetFrames[0]) {
      return { totalDurationMs: 0, sizeBytes: 0, fps: 0 };
    }

    // Average duration/delay per frame
    const delays = targetFrames.map((f) => (useCustomDelay ? customDelayValue : f.duration_ms));
    const totalDurationMs = delays.reduce((sum, d) => sum + d, 0);
    const avgDelay = delays.length > 0 ? totalDurationMs / delays.length : 100;
    const fps = Math.max(1, Math.round(1000 / avgDelay));

    // Base compressed PNG size estimate based on average base64 string bytes length
    const totalPngBytes = targetFrames.reduce((sum, f) => {
      const base64Len = f.image_data ? f.image_data.split(",")[1]?.length || 0 : 0;
      return sum + base64Len * 0.75;
    }, 0);

    // Scaling multipliers to simulate color reductions:
    // 32-bit has full color and alpha details.
    // 24-bit drops alpha channel completely, saving on average 15-20% PNG file size.
    // 8-bit quantizes colors to 256 representation, resulting in heavily optimized and highly compressed retro bitmaps (saves ~50-60%).
    let compressionMultiplier = 1.0;
    if (bitDepth === "24") {
      compressionMultiplier = 0.82;
    } else if (bitDepth === "8") {
      compressionMultiplier = 0.45;
    }

    // Windows Cursor Container binary overhead
    let overhead = 0;

    if (format === "cur" || format === "css") {
      overhead = 22; // Standard single-frame ICONDIR header overhead
    } else if (format === "ani") {
      const steps = targetFrames.length;
      overhead = 12 + 44 + (steps * 4 + 8) + (steps * 4 + 8) + 12 + (steps * 22);
    } else if (format === "zip") {
      overhead = targetFrames.length * 100; // ZIP catalog headers overhead
    } else if (format === "gif") {
      compressionMultiplier = 0.35; // GIF uses robust palette quantization and LZW compression
      overhead = 800; // Global header and palette block
    }

    const sizeBytes = Math.max(256, Math.round(totalPngBytes * compressionMultiplier + overhead));

    return {
      totalDurationMs,
      sizeBytes,
      fps,
    };
  };

  const estimate = calculateEstimate();

  const handleDownloadClick = async () => {
    setIsCompiling(true);
    setExportDetails(null);
    try {
      if (format === "css") {
        const frame = getSelectedCssFrame();
        const cssSnippet = getCssSnippet(includeGlobal);
        const blob = new Blob([cssSnippet], { type: "text/css;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const fileName = "custom_cursor";
        link.href = url;
        link.download = `${fileName}.css`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setExportDetails({
          fileName,
          sizeBytes: cssSnippet.length,
          durationMs: frame.duration_ms,
        });
        return;
      }

      const isMultiFrame = format === "ani" || format === "gif" || format === "zip";
      const details = await onDownload(
        format,
        isMultiFrame ? selectedFrameIndices : [activeFrameIndex],
        isMultiFrame && useCustomDelay ? customDelayValue : null,
        bitDepth
      );
      setExportDetails(details);
    } catch (err) {
      console.error("Error during compilation:", err);
    } finally {
      setIsCompiling(false);
    }
  };

  const psSnippet = `# Save your downloaded cursor file to C:\\custom_cursor.ani first, then run this PowerShell as Admin:

# 1. Copy file to official Cursors folder
Copy-Item "C:\\custom_cursor.ani" -Destination "$env:SystemRoot\\Cursors\\MyCustomCursor.ani" -Force

# 2. Set as Default Normal Select Pointer in registry
Set-ItemProperty -Path "HKCU:\\Control Panel\\Cursors" -Name "Arrow" -Value "$env:SystemRoot\\Cursors\\MyCustomCursor.ani"

# 3. Refresh user settings in real-time
rundll32.exe user32.dll,UpdatePerUserSystemParameters
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(psSnippet);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Human-readable size format
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  // Helper to determine size rating for feedback
  const getSizeRating = (bytes: number) => {
    if (bytes < 5000) return { label: "Ultra Lightweight", color: "text-[#7FBF8E]" };
    if (bytes < 15000) return { label: "Optimal Size", color: "text-[#E8793A]" };
    return { label: "Heavier Sequence", color: "text-amber-400" };
  };

  const sizeRating = getSizeRating(estimate.sizeBytes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <GlassPanel
        className="w-full max-w-3xl p-6 relative max-h-[92vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
        intensity="high"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4">
          <div className="flex items-center space-x-2.5 text-[#F3EDE7]">
            <FileDown className="w-6 h-6 text-[#E8793A]" />
            <div>
              <h2 className="text-xl font-bold tracking-tight">Export & Compile Cursor</h2>
              <p className="text-[11px] text-[#B8ADA3] mt-0.5">Configure, optimize, and export custom files for Windows desktop installation.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-[#B8ADA3] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Estimator Dashboard Header Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-xl bg-black/40 border border-white/5 shadow-inner">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Estimated File Size</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-lg font-mono font-bold text-white">{formatSize(estimate.sizeBytes)}</span>
            </div>
            <span className={`text-[9px] font-semibold block ${sizeRating.color}`}>{sizeRating.label}</span>
          </div>

          <div className="space-y-1 border-l border-white/5 pl-3">
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Frame Rate</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-lg font-mono font-bold text-white">
                {(format === "cur" || format === "css") ? "Static" : `${estimate.fps} FPS`}
              </span>
            </div>
            <span className="text-[9px] text-[#B8ADA3] block truncate">
              {(format === "cur" || format === "css") ? "Single Frame" : `${Math.round(1000 / estimate.fps)}ms interval`}
            </span>
          </div>

          <div className="space-y-1 border-l border-white/5 pl-3">
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Color Bit-Depth</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-lg font-mono font-bold text-white">
                {format === "css" ? "32-bit" : `${bitDepth}-bit`}
              </span>
            </div>
            <span className="text-[9px] text-[#B8ADA3] block">
              {format === "css" || bitDepth === "32" ? "ARGB Transparency" : bitDepth === "24" ? "RGB Opaque" : "256 Palette"}
            </span>
          </div>

          <div className="space-y-1 border-l border-white/5 pl-3">
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Total Frames</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-lg font-mono font-bold text-white">
                {targetFramesCount} / {frames.length}
              </span>
            </div>
            <span className="text-[9px] text-[#B8ADA3] block truncate">
              {(format === "cur" || format === "css") ? "Active frame index" : `Loop: ${(estimate.totalDurationMs / 1000).toFixed(2)}s`}
            </span>
          </div>
        </div>

        {/* Layout divided into Config panels */}
        <div className="space-y-5 mb-6">
          
          {/* 1. Format and Bit Depth options (Side by Side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Format Panel */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-1.5 text-[#F3EDE7]">
                  <Layers className="w-4 h-4 text-[#E8793A]" />
                  <span className="text-xs font-bold uppercase tracking-wider">Output File Format</span>
                </div>
                <p className="text-[10px] text-[#B8ADA3]">Choose between multi-frame animations or single static files.</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setFormat("ani");
                    setExportDetails(null);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                    format === "ani"
                      ? "border-[#E8793A] bg-[#E8793A]/10 text-white"
                      : "border-white/5 bg-black/20 text-[#B8ADA3] hover:bg-black/30"
                  }`}
                >
                  <div className="font-bold text-xs">.ANI (Animated)</div>
                  <div className="text-[9px] text-neutral-400 mt-0.5 leading-tight">Full multi-frame sequential cursor.</div>
                </button>

                <button
                  onClick={() => {
                    setFormat("cur");
                    setExportDetails(null);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                    format === "cur"
                      ? "border-[#E8793A] bg-[#E8793A]/10 text-white"
                      : "border-white/5 bg-black/20 text-[#B8ADA3] hover:bg-black/30"
                  }`}
                >
                  <div className="font-bold text-xs">.CUR (Static)</div>
                  <div className="text-[9px] text-neutral-400 mt-0.5 leading-tight">Exports active single Frame {activeFrameIndex + 1}.</div>
                </button>

                <button
                  onClick={() => {
                    setFormat("gif");
                    setExportDetails(null);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                    format === "gif"
                      ? "border-[#E8793A] bg-[#E8793A]/10 text-white"
                      : "border-white/5 bg-black/20 text-[#B8ADA3] hover:bg-black/30"
                  }`}
                >
                  <div className="font-bold text-xs">.GIF (Animation)</div>
                  <div className="text-[9px] text-neutral-400 mt-0.5 leading-tight">High-quality animated GIF file.</div>
                </button>

                <button
                  onClick={() => {
                    setFormat("zip");
                    setExportDetails(null);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                    format === "zip"
                      ? "border-[#E8793A] bg-[#E8793A]/10 text-white"
                      : "border-white/5 bg-black/20 text-[#B8ADA3] hover:bg-black/30"
                  }`}
                >
                  <div className="font-bold text-xs">.ZIP (PNGs)</div>
                  <div className="text-[9px] text-neutral-400 mt-0.5 leading-tight">ZIP archive of all individual PNG frames.</div>
                </button>

                {/* CSS Web Custom Cursor Snippet */}
                <button
                  onClick={() => {
                    setFormat("css");
                    setExportDetails(null);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between h-20 col-span-2 ${
                    format === "css"
                      ? "border-[#E8793A] bg-[#E8793A]/10 text-white shadow-[0_0_8px_rgba(232,121,58,0.15)]"
                      : "border-white/5 bg-black/20 text-[#B8ADA3] hover:bg-black/30"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5 text-white">
                    <Code className="w-4 h-4 text-[#E8793A]" />
                    <span>CSS Web Snippet</span>
                  </div>
                  <div className="text-[9px] text-neutral-400 mt-1 leading-normal">
                    Generate copy-pasteable base64 custom cursor CSS code directly.
                  </div>
                </button>
              </div>
            </div>

            {/* Bit Depth Panel */}
            {format !== "css" ? (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5 text-[#F3EDE7]">
                    <Cpu className="w-4 h-4 text-[#E8793A]" />
                    <span className="text-xs font-bold uppercase tracking-wider">Bit-Depth (Color Resolution)</span>
                  </div>
                  <p className="text-[10px] text-[#B8ADA3]">Optimize file size or apply a retro style by limiting colors.</p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => {
                      setBitDepth("32");
                      setExportDetails(null);
                    }}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                      bitDepth === "32"
                        ? "border-[#E8793A] bg-[#E8793A]/10 text-white shadow-[0_0_8px_rgba(232,121,58,0.15)]"
                        : "border-white/5 bg-black/20 text-[#B8ADA3] hover:bg-black/30"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">32-Bit</div>
                      <div className="text-[8px] text-[#E8793A] font-semibold">TrueColor+Alpha</div>
                    </div>
                    <div className="text-[8px] text-neutral-400 leading-tight">Smooth transparency.</div>
                  </button>

                  <button
                    onClick={() => {
                      setBitDepth("24");
                      setExportDetails(null);
                    }}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                      bitDepth === "24"
                        ? "border-[#E8793A] bg-[#E8793A]/10 text-white shadow-[0_0_8px_rgba(232,121,58,0.15)]"
                        : "border-white/5 bg-black/20 text-[#B8ADA3] hover:bg-black/30"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">24-Bit</div>
                      <div className="text-[8px] text-amber-500 font-semibold">Opaque RGB</div>
                    </div>
                    <div className="text-[8px] text-neutral-400 leading-tight">No alpha transparency.</div>
                  </button>

                  <button
                    onClick={() => {
                      setBitDepth("8");
                      setExportDetails(null);
                    }}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                      bitDepth === "8"
                        ? "border-[#E8793A] bg-[#E8793A]/10 text-white shadow-[0_0_8px_rgba(232,121,58,0.15)]"
                        : "border-white/5 bg-black/20 text-[#B8ADA3] hover:bg-black/30"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">8-Bit</div>
                      <div className="text-[8px] text-[#7FBF8E] font-semibold">256 Retro</div>
                    </div>
                    <div className="text-[8px] text-neutral-400 leading-tight">Palette quantized. Small.</div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#E8793A]/5 border border-[#E8793A]/20 space-y-3 flex flex-col justify-center">
                <div className="flex items-center space-x-2 text-[#E8793A]">
                  <Cpu className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">True 32-Bit Transparent CSS</span>
                </div>
                <p className="text-[11px] text-[#B8ADA3] leading-relaxed">
                  Web browsers require alpha-channel transparency for custom cursors. The generated CSS base64 snippet maintains lossless 32-bit pixel transparency.
                </p>
              </div>
            )}
          </div>

          {/* 2. Custom Frame Rate & Delay configurations (Dual Delay Binding) */}
          {format !== "cur" && format !== "css" && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-[#F3EDE7]">
                  <Clock className="w-4 h-4 text-[#E8793A]" />
                  <span className="text-xs font-bold uppercase tracking-wider">Frame Rate & Speed Customization</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-[#B8ADA3]">Enable Override:</span>
                  <button
                    onClick={() => {
                      setUseCustomDelay(!useCustomDelay);
                      setExportDetails(null);
                    }}
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      useCustomDelay
                        ? "bg-[#E8793A] text-neutral-900"
                        : "bg-white/10 text-neutral-300 hover:bg-white/20"
                    }`}
                  >
                    {useCustomDelay ? "ENABLED" : "DISABLED"}
                  </button>
                </div>
              </div>

              {!useCustomDelay ? (
                <div className="flex items-start space-x-2 p-3.5 rounded-lg bg-[#E8793A]/5 border border-[#E8793A]/20 text-[11px] text-neutral-300">
                  <Info className="w-4 h-4 text-[#E8793A] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block mb-0.5">Using Individual Timeline Durations</span>
                    The exported file will respect the specific, customized frame durations you drew in the editor timeline. Double click individual frames below to view details.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Millisecond slider */}
                  <div className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#B8ADA3] uppercase">Delay per Frame</span>
                      <span className="font-mono text-[#E8793A] font-bold">{customDelayValue} ms</span>
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="range"
                        min="16"
                        max="1000"
                        step="10"
                        value={customDelayValue}
                        onChange={(e) => handleDelayChange(Number(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#E8793A]"
                      />
                      <input
                        type="number"
                        min="16"
                        max="2000"
                        value={customDelayValue}
                        onChange={(e) => handleDelayChange(Math.max(16, Number(e.target.value)))}
                        className="w-16 bg-neutral-900 border border-white/10 rounded px-1.5 py-1 text-center font-mono text-xs focus:outline-none focus:border-[#E8793A] text-white"
                      />
                    </div>
                  </div>

                  {/* FPS Slider (Dynamic Dual Binding) */}
                  <div className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#B8ADA3] uppercase">Frame Rate Speed</span>
                      <span className="font-mono text-[#E8793A] font-bold">{customFps} FPS</span>
                    </div>
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="range"
                        min="1"
                        max="60"
                        step="1"
                        value={customFps}
                        onChange={(e) => handleFpsChange(Number(e.target.value))}
                        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#E8793A]"
                      />
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={customFps}
                        onChange={(e) => handleFpsChange(Math.max(1, Math.min(60, Number(e.target.value))))}
                        className="w-16 bg-neutral-900 border border-white/10 rounded px-1.5 py-1 text-center font-mono text-xs focus:outline-none focus:border-[#E8793A] text-white"
                      />
                    </div>
                  </div>

                  {/* Common Preset Bindings */}
                  <div className="md:col-span-2 flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mr-1">Speed Presets:</span>
                    {[
                      { label: "Slow (5 FPS)", ms: 200, fps: 5 },
                      { label: "Standard (10 FPS)", ms: 100, fps: 10 },
                      { label: "Smooth (15 FPS)", ms: 66, fps: 15 },
                      { label: "Cinema (24 FPS)", ms: 41, fps: 24 },
                      { label: "High-Speed (30 FPS)", ms: 33, fps: 30 },
                      { label: "Fluid (60 FPS)", ms: 16, fps: 60 },
                    ].map((val) => (
                      <button
                        key={val.label}
                        onClick={() => {
                          setCustomFps(val.fps);
                          setCustomDelayValue(val.ms);
                          setExportDetails(null);
                        }}
                        className="flex-1 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-[9px] text-[#B8ADA3] hover:text-white transition-all cursor-pointer text-center font-medium font-sans"
                      >
                        {val.fps} FPS
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Frame Batch Selector Panel (Only shown for Animated formats) */}
          {format !== "cur" && format !== "css" && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-[#F3EDE7]">
                  <Settings2 className="w-4 h-4 text-[#E8793A]" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Batch Frame Selection ({selectedFrameIndices.length}/{frames.length} frames)
                  </span>
                </div>
                <div className="flex items-center space-x-2.5 text-[11px] font-semibold">
                  <button
                    onClick={() => {
                      setSelectedFrameIndices(frames.map((_, idx) => idx));
                      setExportDetails(null);
                    }}
                    className="text-[#E8793A] hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-white/10">|</span>
                  <button
                    onClick={() => {
                      setSelectedFrameIndices([]);
                      setExportDetails(null);
                    }}
                    className="text-[#B8ADA3] hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Scrollable Frame Selector Thumbnails */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1.5 rounded-lg bg-black/30 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {frames.map((frame, index) => {
                  const isSelected = selectedFrameIndices.includes(index);
                  return (
                    <div
                      key={index}
                      onClick={() => {
                        let updated;
                        if (isSelected) {
                          updated = selectedFrameIndices.filter((idx) => idx !== index);
                        } else {
                          updated = [...selectedFrameIndices, index].sort((a, b) => a - b);
                        }
                        setSelectedFrameIndices(updated);
                        setExportDetails(null);
                      }}
                      className={`relative aspect-square p-1 rounded-lg border flex flex-col items-center justify-between cursor-pointer transition-all select-none group ${
                        isSelected
                          ? "border-[#E8793A] bg-[#E8793A]/5 shadow-[0_0_8px_rgba(232,121,58,0.15)]"
                          : "border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="absolute top-1 left-1.5 text-[9px] font-mono font-bold leading-none text-[#B8ADA3]">
                        {index + 1}
                      </div>

                      <div className="absolute top-1 right-1">
                        {isSelected ? (
                          <CheckSquare className="w-3 h-3 text-[#E8793A]" />
                        ) : (
                          <Square className="w-3 h-3 text-white/10 group-hover:text-white/30" />
                        )}
                      </div>

                      <div className="w-8 h-8 mt-2 rounded bg-neutral-950 border border-white/5 flex items-center justify-center relative overflow-hidden">
                        <div
                          className="absolute inset-0 bg-neutral-900/20 pointer-events-none"
                          style={{
                            backgroundImage:
                              "linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)",
                            backgroundSize: "4px 4px",
                            backgroundPosition: "0 0, 0 2px, 2px -2px, -2px 0px",
                          }}
                        />
                        <img
                          src={frame.image_data}
                          alt={`F${index + 1}`}
                          className="w-6 h-6 object-contain z-10 select-none image-render-pixelated"
                        />
                      </div>

                      <div className="text-[8px] font-mono text-[#B8ADA3] font-semibold mt-0.5">
                        {useCustomDelay ? `${customDelayValue}ms` : `${frame.duration_ms}ms`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. CSS Web Snippet Export Panel */}
          {format === "css" && (
            <div className="space-y-4">
              {/* Frame selector */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-[#F3EDE7]">
                    <Settings2 className="w-4 h-4 text-[#E8793A]" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Select Target Frame for CSS Export
                    </span>
                  </div>
                  <span className="text-[10px] text-[#B8ADA3]">
                    Frame {selectedCssFrameIndex + 1} of {frames.length} selected
                  </span>
                </div>

                {/* Scrollable Frame Selector Thumbnails */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1.5 rounded-lg bg-black/30 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {frames.map((frame, index) => {
                    const isSelected = selectedCssFrameIndex === index;
                    return (
                      <div
                        key={index}
                        onClick={() => {
                          setSelectedCssFrameIndex(index);
                          setExportDetails(null);
                        }}
                        className={`relative aspect-square p-1 rounded-lg border flex flex-col items-center justify-between cursor-pointer transition-all select-none group ${
                          isSelected
                            ? "border-[#E8793A] bg-[#E8793A]/5 shadow-[0_0_8px_rgba(232,121,58,0.15)]"
                            : "border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]"
                        }`}
                      >
                        <div className="absolute top-1 left-1.5 text-[9px] font-mono font-bold leading-none text-[#B8ADA3]">
                          {index + 1}
                        </div>

                        <div className="w-8 h-8 mt-2 rounded bg-neutral-950 border border-white/5 flex items-center justify-center relative overflow-hidden mx-auto">
                          <div
                            className="absolute inset-0 bg-neutral-900/20 pointer-events-none"
                            style={{
                              backgroundImage:
                                "linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)",
                              backgroundSize: "4px 4px",
                              backgroundPosition: "0 0, 0 2px, 2px -2px, -2px 0px",
                            }}
                          />
                          <img
                            src={frame.image_data}
                            alt={`F${index + 1}`}
                            className="w-6 h-6 object-contain z-10 select-none image-render-pixelated"
                          />
                        </div>

                        <div className="text-[8px] font-mono text-[#B8ADA3] font-semibold mt-1">
                          Hotspot: {frame.hotspot_x},{frame.hotspot_y}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Hover Zone & Snippet Selector */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Live Interactive Sandbox */}
                <div
                  className="md:col-span-1 p-4 rounded-xl border-2 border-dashed border-[#E8793A]/30 bg-black/40 flex flex-col items-center justify-center text-center transition-colors group hover:border-[#E8793A]/60"
                  style={{
                    cursor: (() => {
                      const frame = getSelectedCssFrame();
                      if (!frame) return "auto";
                      try {
                        const curBytes = writeCurFile(
                          frame.width,
                          frame.height,
                          frame.hotspot_x,
                          frame.hotspot_y,
                          frame.image_data
                        );
                        const base64Data = bytesToBase64(curBytes);
                        return `url('data:image/x-icon;base64,${base64Data}') ${frame.hotspot_x} ${frame.hotspot_y}, auto`;
                      } catch (e) {
                        return "auto";
                      }
                    })()
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-[#E8793A]/10 flex items-center justify-center text-[#E8793A] mb-2 font-black text-lg group-hover:scale-110 transition-transform">
                    ✨
                  </div>
                  <h4 className="text-xs font-bold text-[#F3EDE7] mb-1">Hover & Test Sandbox</h4>
                  <p className="text-[10px] text-[#B8ADA3] leading-normal select-none">
                    Move your mouse inside this box to test your custom cursor in real-time!
                  </p>
                </div>

                {/* 2. Snippet Controls & Display */}
                <div className="md:col-span-2 p-4 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      CSS Integration Snippet
                    </span>
                    <div className="flex bg-neutral-900 rounded-lg p-0.5 border border-white/5">
                      <button
                        type="button"
                        onClick={() => setIncludeGlobal(false)}
                        className={`px-2.5 py-1 rounded text-[9px] font-bold transition-all cursor-pointer ${
                          !includeGlobal
                            ? "bg-[#E8793A] text-neutral-950"
                            : "text-[#B8ADA3] hover:text-white"
                        }`}
                      >
                        Class (.custom-cursor)
                      </button>
                      <button
                        type="button"
                        onClick={() => setIncludeGlobal(true)}
                        className={`px-2.5 py-1 rounded text-[9px] font-bold transition-all cursor-pointer ${
                          includeGlobal
                            ? "bg-[#E8793A] text-neutral-950"
                            : "text-[#B8ADA3] hover:text-white"
                        }`}
                      >
                        Global (html, body)
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <pre className="p-3 rounded-lg bg-black/60 border border-white/5 font-mono text-[9px] text-teal-400 overflow-x-auto whitespace-pre leading-relaxed max-h-24 select-all scrollbar-thin">
                      {getCssSnippet(includeGlobal)}
                    </pre>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(getCssSnippet(includeGlobal));
                        setIsCssCopied(true);
                        setTimeout(() => setIsCssCopied(false), 2000);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded bg-white/5 hover:bg-white/10 text-[#B8ADA3] hover:text-white transition-all cursor-pointer border border-white/5"
                      title="Copy to clipboard"
                    >
                      {isCssCopied ? (
                        <Check className="w-3.5 h-3.5 text-[#7FBF8E]" />
                      ) : (
                        <CopyIcon className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <p className="text-[9px] text-[#B8ADA3] mt-2 leading-relaxed">
                    💡 <strong>Pro-Tip:</strong> The `.cur` format is packed inside a Data URL using the original cursor hotspot coordinates <strong>({getSelectedCssFrame()?.hotspot_x}, {getSelectedCssFrame()?.hotspot_y})</strong>, ensuring perfect click alignment!
                  </p>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Compile Progress / Details */}
        {exportDetails && (
          <div className="mb-6 p-4 rounded-xl bg-[#7FBF8E]/10 border border-[#7FBF8E]/30 text-white space-y-2">
            <div className="flex items-center space-x-2 text-[#7FBF8E]">
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span className="font-bold text-sm">Successfully Compiled and Triggered Download!</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 pt-1.5 text-xs font-mono">
              <div className="bg-black/20 p-2.5 rounded border border-white/5">
                <div className="text-neutral-400 text-[9px] uppercase tracking-wider">File Name</div>
                <div className="text-[#F3EDE7] font-semibold truncate mt-0.5">{exportDetails.fileName}.{format === "css" ? "css" : format}</div>
              </div>
              <div className="bg-black/20 p-2.5 rounded border border-white/5">
                <div className="text-neutral-400 text-[9px] uppercase tracking-wider">Actual File Size</div>
                <div className="text-[#F3EDE7] font-semibold mt-0.5">{formatSize(exportDetails.sizeBytes)}</div>
              </div>
              <div className="bg-black/20 p-2.5 rounded border border-white/5">
                <div className="text-neutral-400 text-[9px] uppercase tracking-wider">Loop/Frame Duration</div>
                <div className="text-[#F3EDE7] font-semibold mt-0.5">{(exportDetails.durationMs / 1000).toFixed(2)}s</div>
              </div>
            </div>
          </div>
        )}

        {/* Compile Trigger Actions */}
        <div className="mb-5 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-white font-semibold transition-all cursor-pointer text-sm text-center"
          >
            Close Settings
          </button>

          <button
            onClick={handleDownloadClick}
            disabled={isCompiling || (format !== "cur" && format !== "css" && selectedFrameIndices.length === 0)}
            className="flex-[2] py-3 px-4 rounded-xl bg-[#E8793A] hover:bg-[#F2925C] text-[#1C1512] font-bold transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[#E8793A]/10 cursor-pointer disabled:opacity-40 disabled:pointer-events-none text-sm"
          >
            {isCompiling ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#1C1512]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Processing color pixels...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4.5 h-4.5" />
                <span>Compile & Download {format === "css" ? ".CSS Stylesheet" : format.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>

        {/* Standard Installation Guide collapsible (Contextual: Windows vs Web CSS) */}
        <div className="border border-white/5 rounded-xl overflow-hidden bg-black/20">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full p-4 flex items-center justify-between text-left text-sm font-bold text-[#F3EDE7] hover:bg-white/[0.02] transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Monitor className="w-4 h-4 text-[#E8793A]" />
              <span>{format === "css" ? "Web CSS Integration Guide" : "Standard Windows Installation Guide"}</span>
            </div>
            {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showGuide && (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-white/5 bg-black/10">
              {format === "css" ? (
                [
                  {
                    step: 1,
                    title: "Copy Snippet",
                    desc: "Click the copy button inside the code block above to save the base64-encoded CSS cursor rule to your clipboard.",
                  },
                  {
                    step: 2,
                    title: "Add to Stylesheet",
                    desc: "Paste the copied CSS class or body rules directly into your web project's stylesheet (e.g., styles.css).",
                  },
                  {
                    step: 3,
                    title: "Apply CSS Class",
                    desc: "Apply the 'custom-cursor' class to any HTML container element, or apply globally using body/html selectors.",
                  },
                  {
                    step: 4,
                    title: "Hover & Verify",
                    desc: "Test interaction in your browser! Your custom custom-styled cursors will align precisely using local hot-spot offsets.",
                  },
                ].map((s) => (
                  <div key={s.step} className="p-3 rounded-lg bg-white/[0.01] border border-white/5 relative">
                    <div className="absolute top-2 right-3 font-mono font-bold text-[10px] text-[#E8793A]/70 bg-[#E8793A]/10 rounded-full w-5 h-5 flex items-center justify-center">
                      {s.step}
                    </div>
                    <h4 className="text-xs font-bold text-[#F3EDE7]">{s.title}</h4>
                    <p className="text-[10px] text-[#B8ADA3] mt-1 leading-normal">{s.desc}</p>
                  </div>
                ))
              ) : (
                [
                  {
                    step: 1,
                    title: "Save Download",
                    desc: "Save the downloaded .ani or .cur file into your Downloads or C:\\Windows\\Cursors folder.",
                  },
                  {
                    step: 2,
                    title: "Open Settings",
                    desc: "Right-click on your Desktop → Personalize → Themes → Mouse pointer settings.",
                  },
                  {
                    step: 3,
                    title: "Browse Cursor",
                    desc: "Highlight 'Normal Select' (or any other pointer style) → click the 'Browse...' button.",
                  },
                  {
                    step: 4,
                    title: "Select & Apply",
                    desc: "Choose your newly downloaded file, click Open, then click 'Apply' to enjoy your custom cursor!",
                  },
                ].map((s) => (
                  <div key={s.step} className="p-3 rounded-lg bg-white/[0.01] border border-white/5 relative">
                    <div className="absolute top-2 right-3 font-mono font-bold text-[10px] text-[#E8793A]/70 bg-[#E8793A]/10 rounded-full w-5 h-5 flex items-center justify-center">
                      {s.step}
                    </div>
                    <h4 className="text-xs font-bold text-[#F3EDE7]">{s.title}</h4>
                    <p className="text-[10px] text-[#B8ADA3] mt-1 leading-normal">{s.desc}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Copy command advanced collapsible (Only show for standard Windows formats) */}
        {format !== "css" && (
          <div className="mt-4 p-4 border border-[#6E5A7B]/30 rounded-xl bg-[#6E5A7B]/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#F3EDE7]">
                <ShieldAlert className="w-4 h-4 text-[#6E5A7B]" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Advanced: PowerShell Auto-Install</h4>
              </div>
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#6E5A7B]/40 hover:bg-[#6E5A7B]/60 text-xs font-medium text-white transition-all cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-[#7FBF8E]" /> : <CopyIcon className="w-3.5 h-3.5" />}
                <span>{isCopied ? "Copied!" : "Copy Command"}</span>
              </button>
            </div>
            <p className="text-[11px] text-[#B8ADA3] mt-1 leading-normal">
              For advanced users. Run the copied PowerShell code in Administrator shell to set the default pointer instantly without looking through menus.
            </p>
            <pre className="mt-3 p-3 rounded-lg bg-black/60 border border-white/5 font-mono text-[9px] text-[#B8ADA3] overflow-x-auto whitespace-pre leading-normal max-h-36">
              {psSnippet}
            </pre>
          </div>
        )}
      </GlassPanel>
    </div>
  );
};
