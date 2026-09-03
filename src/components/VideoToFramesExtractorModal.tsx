import React, { useState, useRef, useEffect } from "react";
import { 
  X, Video, Film, Wand2, Sliders, Play, Pause, Scissors, 
  Eye, RefreshCw, Trash2, Check, Droplet, Sparkles, Layers, 
  Zap, ArrowRight, Download, MousePointer, Info, RotateCcw
} from "lucide-react";
import { CursorFrame } from "../engine/curParser.ts";
import { extractFramesFromVideoUrl } from "../services/videoProcessor.ts";

interface VideoToFramesExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFramesExtracted: (frames: CursorFrame[], projectName: string) => void;
  initialFile?: File | null;
}

export type BgRemovalMode = "none" | "black" | "white" | "chroma_green" | "chroma_blue" | "custom";

export const VideoToFramesExtractorModal: React.FC<VideoToFramesExtractorModalProps> = ({
  isOpen,
  onClose,
  onFramesExtracted,
  initialFile,
}) => {
  const [videoFile, setVideoFile] = useState<File | null>(initialFile || null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Trimming parameters (in seconds)
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(3);

  // Extraction parameters
  const [frameCount, setFrameCount] = useState<number>(16);
  const [canvasResolution, setCanvasResolution] = useState<number>(32); // 32x32, 48x48, 64x64
  const [frameDurationMs, setFrameDurationMs] = useState<number>(80);
  const [hotspotX, setHotspotX] = useState<number>(0);
  const [hotspotY, setHotspotY] = useState<number>(0);

  // Background removal / Keying options
  const [bgMode, setBgMode] = useState<BgRemovalMode>("black");
  const [keyColor, setKeyColor] = useState<string>("#00FF00"); // Green screen default for custom
  const [keyTolerance, setKeyTolerance] = useState<number>(35); // 0-100 threshold

  // Video FX / Filters
  const [hueRotate, setHueRotate] = useState<number>(0); // 0-360
  const [brightness, setBrightness] = useState<number>(100); // 50-200%
  const [contrast, setContrast] = useState<number>(100); // 50-200%
  const [saturation, setSaturation] = useState<number>(100); // 0-200%
  const [invert, setInvert] = useState<boolean>(false);
  const [neonGlow, setNeonGlow] = useState<boolean>(false);
  const [neonColor, setNeonColor] = useState<string>("#E8793A");
  const [pixelate, setPixelate] = useState<boolean>(false);

  // Extracted Frames state
  const [extractedFrames, setExtractedFrames] = useState<CursorFrame[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(true);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewTimerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize video file URL
  useEffect(() => {
    if (initialFile) {
      handleFileSelected(initialFile);
    }
  }, [initialFile]);

  useEffect(() => {
    if (!videoFile) return;
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [videoFile]);

  // Handle Video Metadata Loaded
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const duration = videoRef.current.duration || 1;
    const w = videoRef.current.videoWidth || 320;
    const h = videoRef.current.videoHeight || 320;

    setVideoDuration(duration);
    setVideoDimensions({ width: w, height: h });
    setStartTime(0);
    setEndTime(Math.min(3, duration));

    // Default hotspot to top-left or center
    setHotspotX(0);
    setHotspotY(0);

    // Auto trigger initial frame extraction
    extractVideoFrames(0, Math.min(3, duration), frameCount, canvasResolution);
  };

  const handleFileSelected = (file: File) => {
    if (!file.type.startsWith("video/")) {
      alert("Please select a valid video file (.mp4, .webm, .mov, etc.).");
      return;
    }
    setVideoFile(file);
    setExtractedFrames([]);
  };

  // Toggle Video Play/Pause
  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Handle Video Time Update
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    setCurrentTime(current);

    // Loop within trim range if playing
    if (isPlaying && current >= endTime) {
      videoRef.current.currentTime = startTime;
    }
  };

  // Extracted Animation Loop Timer
  useEffect(() => {
    if (extractedFrames.length === 0 || !isPreviewPlaying) return;

    previewTimerRef.current = setInterval(() => {
      setActivePreviewIndex((prev) => (prev + 1) % extractedFrames.length);
    }, frameDurationMs);

    return () => {
      if (previewTimerRef.current) clearInterval(previewTimerRef.current);
    };
  }, [extractedFrames, isPreviewPlaying, frameDurationMs]);

  // Helper function to extract color components from hex
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 255, b: 0 };
  };

  // Process canvas pixels (Chroma/Luma keying, FX, Neon glow, Invert)
  const applyPixelEffects = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const targetRgb = hexToRgb(keyColor);
    const tol = (keyTolerance / 100) * 255;

    // First pass: Chroma Key & Background Removal
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      let makeTransparent = false;

      if (bgMode === "black") {
        // Remove dark pixels below threshold
        const brightnessVal = (r + g + b) / 3;
        if (brightnessVal < tol) {
          makeTransparent = true;
        }
      } else if (bgMode === "white") {
        // Remove light pixels above threshold
        const brightnessVal = (r + g + b) / 3;
        if (brightnessVal > 255 - tol) {
          makeTransparent = true;
        }
      } else if (bgMode === "chroma_green") {
        // Green screen keying
        if (g > 100 && g > r * 1.2 && g > b * 1.2 && Math.abs(g - 255) < tol + 100) {
          makeTransparent = true;
        }
      } else if (bgMode === "chroma_blue") {
        // Blue screen keying
        if (b > 100 && b > r * 1.2 && b > g * 1.2 && Math.abs(b - 255) < tol + 100) {
          makeTransparent = true;
        }
      } else if (bgMode === "custom") {
        // Custom color distance keying
        const dist = Math.sqrt(
          (r - targetRgb.r) ** 2 +
            (g - targetRgb.g) ** 2 +
            (b - targetRgb.b) ** 2
        );
        if (dist < tol * 1.7) {
          makeTransparent = true;
        }
      }

      if (makeTransparent) {
        data[i + 3] = 0; // Alpha = 0
        continue;
      }

      // Color Invert
      if (invert) {
        data[i] = 255 - r;
        data[i + 1] = 255 - g;
        data[i + 2] = 255 - b;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Apply Neon Glow Filter if enabled
    if (neonGlow) {
      const glowRgb = hexToRgb(neonColor);
      ctx.save();
      ctx.shadowColor = `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, 0.9)`;
      ctx.shadowBlur = 6;
      ctx.drawImage(ctx.canvas, 0, 0);
      ctx.restore();
    }
  };

  // Main Core: Video Frame Sampling Engine using videoProcessor service
  const extractVideoFrames = async (
    sTime = startTime,
    eTime = endTime,
    fCount = frameCount,
    res = canvasResolution
  ) => {
    if (!videoUrl) return;
    setIsProcessing(true);

    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    try {
      const newFrames = await extractFramesFromVideoUrl({
        videoUrl,
        startTime: sTime,
        endTime: eTime,
        frameCount: fCount,
        resolution: res,
        frameDurationMs,
        hotspotX,
        hotspotY,
        bgMode,
        keyColor,
        keyTolerance,
        hueRotate,
        brightness,
        contrast,
        saturation,
        invert,
        neonGlow,
        neonColor,
        pixelate,
      });

      setExtractedFrames(newFrames);
      setActivePreviewIndex(0);
    } catch (err) {
      console.error("Frame extraction error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-run extraction when trim/count/effects change
  const handleApplyChanges = () => {
    extractVideoFrames(startTime, endTime, frameCount, canvasResolution);
  };

  const handleDeleteFrame = (index: number) => {
    setExtractedFrames((prev) => prev.filter((_, i) => i !== index));
    if (activePreviewIndex >= extractedFrames.length - 1) {
      setActivePreviewIndex(0);
    }
  };

  const handleFinishAndImport = () => {
    if (extractedFrames.length === 0) {
      alert("No frames extracted yet. Please upload a video and click Extract Frames!");
      return;
    }

    const projName = videoFile
      ? videoFile.name.replace(/\.[^/.]+$/, "") + "_video_cursor"
      : "video_cursor_animation";

    onFramesExtracted(extractedFrames, projName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[#14100E] border border-white/10 shadow-2xl overflow-hidden text-[#F3EDE7]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#E8793A]/20 border border-[#E8793A]/40 flex items-center justify-center text-[#E8793A]">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Video to Cursor Extractor
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#E8793A]/20 text-[#E8793A] border border-[#E8793A]/30 font-semibold">
                  New Feature
                </span>
              </h2>
              <p className="text-xs text-[#B8ADA3]">
                Upload any video format (MP4, WEBM, MOV) and extract video frames into an animated Windows cursor.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#B8ADA3] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Video Source & Controls (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-5">
            {/* File Upload Zone / Player Box */}
            <div className="relative rounded-xl border border-white/10 bg-black/40 overflow-hidden flex flex-col min-h-[260px] justify-center items-center">
              {!videoUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/[0.02] transition-all group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelected(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-[#E8793A]/50 transition-all">
                    <Film className="w-8 h-8 text-[#E8793A]" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Upload Video (Any File Size)
                  </h3>
                  <p className="text-xs text-[#B8ADA3] max-w-xs mb-3">
                    Drag & drop or click to select MP4, WEBM, MOV, M4V, AVI video files.
                  </p>
                  <span className="px-3 py-1 rounded-full bg-[#E8793A] text-[#1C1512] text-xs font-bold shadow-md shadow-[#E8793A]/20">
                    Select Video File
                  </span>
                </div>
              ) : (
                <div className="relative w-full flex flex-col items-center justify-center bg-black">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    playsInline
                    muted
                    className="max-h-[240px] w-auto object-contain rounded-lg"
                    style={{
                      filter: `hue-rotate(${hueRotate}deg) brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                    }}
                  />

                  {/* Video Overlay Play Trigger */}
                  <button
                    onClick={toggleVideoPlay}
                    className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-black/60 hover:bg-[#E8793A] text-white hover:text-[#1C1512] flex items-center justify-center transition-all border border-white/20 cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>

                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md text-[11px] font-mono border border-white/10">
                    <span className="text-[#E8793A] font-bold">
                      {currentTime.toFixed(2)}s / {videoDuration.toFixed(2)}s
                    </span>
                    <span className="text-[#B8ADA3]">
                      {videoDimensions.width}x{videoDimensions.height} px
                    </span>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-[#E8793A] hover:underline cursor-pointer"
                    >
                      Change Video
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileSelected(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Video Trim & Extraction Controls */}
            {videoUrl && (
              <div className="space-y-4 bg-white/[0.02] p-4 rounded-xl border border-white/10">
                <div className="flex items-center justify-between text-xs font-bold text-white border-b border-white/5 pb-2">
                  <span className="flex items-center gap-1.5 text-[#E8793A]">
                    <Scissors className="w-4 h-4" />
                    Trim Video Loop Section
                  </span>
                  <span className="text-[#B8ADA3] font-mono">
                    Loop Duration: {(endTime - startTime).toFixed(2)}s
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[#B8ADA3] mb-1">Start Time: {startTime.toFixed(2)}s</label>
                    <input
                      type="range"
                      min="0"
                      max={Math.max(0, endTime - 0.1)}
                      step="0.05"
                      value={startTime}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setStartTime(val);
                        if (videoRef.current) videoRef.current.currentTime = val;
                      }}
                      className="w-full accent-[#E8793A] cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[#B8ADA3] mb-1">End Time: {endTime.toFixed(2)}s</label>
                    <input
                      type="range"
                      min={startTime + 0.1}
                      max={videoDuration || 10}
                      step="0.05"
                      value={endTime}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setEndTime(val);
                        if (videoRef.current) videoRef.current.currentTime = val;
                      }}
                      className="w-full accent-[#E8793A] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Sampling Parameters */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#B8ADA3] mb-1">Frame Count</label>
                    <select
                      value={frameCount}
                      onChange={(e) => setFrameCount(parseInt(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-[#E8793A]"
                    >
                      <option value={8}>8 Frames (Light)</option>
                      <option value={12}>12 Frames</option>
                      <option value={16}>16 Frames (Standard .ANI)</option>
                      <option value={24}>24 Frames (Smooth)</option>
                      <option value={32}>32 Frames (Ultra Smooth)</option>
                      <option value={48}>48 Frames (High FPS)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#B8ADA3] mb-1">Cursor Canvas</label>
                    <select
                      value={canvasResolution}
                      onChange={(e) => setCanvasResolution(parseInt(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-[#E8793A]"
                    >
                      <option value={32}>32 x 32 px (Standard)</option>
                      <option value={48}>48 x 48 px (HD Pointer)</option>
                      <option value={64}>64 x 64 px (4K Pointer)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#B8ADA3] mb-1">Frame Delay</label>
                    <select
                      value={frameDurationMs}
                      onChange={(e) => setFrameDurationMs(parseInt(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-[#E8793A]"
                    >
                      <option value={40}>40 ms (25 FPS)</option>
                      <option value={60}>60 ms (16.6 FPS)</option>
                      <option value={80}>80 ms (12.5 FPS)</option>
                      <option value={100}>100 ms (10 FPS)</option>
                      <option value={150}>150 ms (6.6 FPS)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Background Removal / Chroma Key Options */}
            {videoUrl && (
              <div className="space-y-3 bg-white/[0.02] p-4 rounded-xl border border-white/10">
                <div className="flex items-center justify-between text-xs font-bold text-white border-b border-white/5 pb-2">
                  <span className="flex items-center gap-1.5 text-[#E8793A]">
                    <Droplet className="w-4 h-4" />
                    Background Removal / Chroma Key
                  </span>
                  <span className="text-[10px] text-[#B8ADA3]">Cut out video backgrounds</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => setBgMode("black")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      bgMode === "black"
                        ? "bg-[#E8793A] text-[#1C1512] border-[#E8793A]"
                        : "bg-black/40 text-[#B8ADA3] border-white/10 hover:text-white"
                    }`}
                  >
                    Remove Black BG
                  </button>
                  <button
                    onClick={() => setBgMode("white")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      bgMode === "white"
                        ? "bg-[#E8793A] text-[#1C1512] border-[#E8793A]"
                        : "bg-black/40 text-[#B8ADA3] border-white/10 hover:text-white"
                    }`}
                  >
                    Remove White BG
                  </button>
                  <button
                    onClick={() => setBgMode("chroma_green")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      bgMode === "chroma_green"
                        ? "bg-[#E8793A] text-[#1C1512] border-[#E8793A]"
                        : "bg-black/40 text-[#B8ADA3] border-white/10 hover:text-white"
                    }`}
                  >
                    Green Screen Key
                  </button>
                  <button
                    onClick={() => setBgMode("chroma_blue")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      bgMode === "chroma_blue"
                        ? "bg-[#E8793A] text-[#1C1512] border-[#E8793A]"
                        : "bg-black/40 text-[#B8ADA3] border-white/10 hover:text-white"
                    }`}
                  >
                    Blue Screen Key
                  </button>
                  <button
                    onClick={() => setBgMode("none")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      bgMode === "none"
                        ? "bg-[#E8793A] text-[#1C1512] border-[#E8793A]"
                        : "bg-black/40 text-[#B8ADA3] border-white/10 hover:text-white"
                    }`}
                  >
                    Keep Full Video
                  </button>
                  <div className="flex items-center space-x-2 bg-black/40 px-2 rounded-lg border border-white/10">
                    <span className="text-[10px] text-[#B8ADA3]">Color:</span>
                    <input
                      type="color"
                      value={keyColor}
                      onChange={(e) => {
                        setKeyColor(e.target.value);
                        setBgMode("custom");
                      }}
                      className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                    />
                  </div>
                </div>

                {bgMode !== "none" && (
                  <div className="pt-1">
                    <div className="flex justify-between text-[11px] text-[#B8ADA3] mb-1">
                      <span>Keying Tolerance (Threshold)</span>
                      <span>{keyTolerance}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="80"
                      value={keyTolerance}
                      onChange={(e) => setKeyTolerance(parseInt(e.target.value))}
                      className="w-full accent-[#E8793A] cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Video FX & Extracted Frames Live Preview (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-5">
            {/* Video FX & Filters */}
            {videoUrl && (
              <div className="bg-white/[0.02] p-4 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white border-b border-white/5 pb-2">
                  <span className="flex items-center gap-1.5 text-[#E8793A]">
                    <Sparkles className="w-4 h-4" />
                    Video Color FX & Filters
                  </span>
                  <button
                    onClick={() => {
                      setHueRotate(0);
                      setBrightness(100);
                      setContrast(100);
                      setSaturation(100);
                      setInvert(false);
                      setNeonGlow(false);
                      setPixelate(false);
                    }}
                    className="text-[10px] text-[#B8ADA3] hover:text-white flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-[#B8ADA3] mb-1">
                      <span>Color Hue Rotate</span>
                      <span>{hueRotate}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={hueRotate}
                      onChange={(e) => setHueRotate(parseInt(e.target.value))}
                      className="w-full accent-[#E8793A] cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-[11px] text-[#B8ADA3] mb-1">
                        <span>Brightness</span>
                        <span>{brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        value={brightness}
                        onChange={(e) => setBrightness(parseInt(e.target.value))}
                        className="w-full accent-[#E8793A] cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-[#B8ADA3] mb-1">
                        <span>Contrast</span>
                        <span>{contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="200"
                        value={contrast}
                        onChange={(e) => setContrast(parseInt(e.target.value))}
                        className="w-full accent-[#E8793A] cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <button
                      onClick={() => setInvert(!invert)}
                      className={`px-2.5 py-1 rounded text-xs font-medium border transition-all cursor-pointer ${
                        invert
                          ? "bg-[#E8793A] text-[#1C1512] border-[#E8793A]"
                          : "bg-black/40 text-[#B8ADA3] border-white/10"
                      }`}
                    >
                      Invert Colors
                    </button>
                    <button
                      onClick={() => setNeonGlow(!neonGlow)}
                      className={`px-2.5 py-1 rounded text-xs font-medium border transition-all cursor-pointer ${
                        neonGlow
                          ? "bg-[#E8793A] text-[#1C1512] border-[#E8793A]"
                          : "bg-black/40 text-[#B8ADA3] border-white/10"
                      }`}
                    >
                      Neon Glow
                    </button>
                    <button
                      onClick={() => setPixelate(!pixelate)}
                      className={`px-2.5 py-1 rounded text-xs font-medium border transition-all cursor-pointer ${
                        pixelate
                          ? "bg-[#E8793A] text-[#1C1512] border-[#E8793A]"
                          : "bg-black/40 text-[#B8ADA3] border-white/10"
                      }`}
                    >
                      Pixel Art Filter
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleApplyChanges}
                  disabled={isProcessing}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#E8793A] to-[#F2925C] text-[#1C1512] font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-[#E8793A]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#1C1512] border-t-transparent rounded-full animate-spin"></div>
                      <span>Extracting Video Frames...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Process & Extract Frames Now</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Extracted Cursor Frames Live Preview Loop */}
            <div className="flex-1 bg-white/[0.02] p-4 rounded-xl border border-white/10 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#E8793A]" />
                  Extracted Cursor Animation Loop ({extractedFrames.length} Frames)
                </span>
                <span className="text-[10px] font-mono text-[#E8793A]">
                  {canvasResolution}x{canvasResolution} px
                </span>
              </div>

              {/* Loop Preview Box */}
              <div className="relative w-full h-36 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden">
                {/* Checkerboard background for transparency */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`,
                    backgroundSize: "8px 8px",
                  }}
                ></div>

                {extractedFrames.length > 0 ? (
                  <div className="relative flex flex-col items-center justify-center">
                    <img
                      src={extractedFrames[activePreviewIndex]?.dataUrl}
                      alt={`Frame ${activePreviewIndex}`}
                      className="w-16 h-16 object-contain image-rendering-pixelated drop-shadow-xl"
                    />
                    <div className="absolute top-0 left-0 w-2 h-2 rounded-full bg-[#E8793A] -translate-x-1/2 -translate-y-1/2" title="Hotspot"></div>
                    <span className="mt-2 text-[10px] font-mono text-[#B8ADA3]">
                      Frame {activePreviewIndex + 1} / {extractedFrames.length} ({frameDurationMs}ms)
                    </span>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <Layers className="w-8 h-8 text-[#B8ADA3]/40 mx-auto mb-2" />
                    <p className="text-xs text-[#B8ADA3]">
                      Upload a video & click <span className="text-[#E8793A] font-semibold">Process & Extract</span> to preview extracted cursor loop!
                    </p>
                  </div>
                )}
              </div>

              {/* Extracted Frames Grid */}
              {extractedFrames.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#B8ADA3]">
                    <span>Extracted Frames Grid:</span>
                    <button
                      onClick={() => setExtractedFrames([])}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Clear Frames
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5 max-h-32 overflow-y-auto p-1 bg-black/40 rounded-lg border border-white/5">
                    {extractedFrames.map((f, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActivePreviewIndex(idx)}
                        className={`relative group rounded-md p-1 border cursor-pointer transition-all flex items-center justify-center ${
                          activePreviewIndex === idx
                            ? "border-[#E8793A] bg-[#E8793A]/10 scale-105"
                            : "border-white/10 hover:border-white/30 bg-black/40"
                        }`}
                      >
                        <img
                          src={f.dataUrl}
                          alt={`Frame ${idx}`}
                          className="w-7 h-7 object-contain image-rendering-pixelated"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFrame(idx);
                          }}
                          className="absolute -top-1 -right-1 p-0.5 rounded bg-black/80 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#B8ADA3] hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleFinishAndImport}
            disabled={extractedFrames.length === 0}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#E8793A] hover:bg-[#F2925C] text-[#1C1512] font-bold text-xs transition-all shadow-lg shadow-[#E8793A]/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          >
            <span>Convert & Open in Cursor Editor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
