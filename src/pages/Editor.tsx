import React, { useState, useEffect, useRef } from "react";
import { MousePointer, ArrowLeft, Save, FileDown, Undo, Redo, HelpCircle, AlertCircle, ChevronRight, Check, RefreshCw, Eye, Grid, Layers, Keyboard, Search, X } from "lucide-react";
import { GlassPanel } from "../components/GlassPanel.tsx";
import { PreviewCanvas } from "../components/PreviewCanvas.tsx";
import { Timeline } from "../components/Timeline.tsx";
import { Inspector } from "../components/Inspector.tsx";
import { EffectGallery } from "../components/EffectGallery.tsx";
import { ExportModal } from "../components/ExportModal.tsx";
import { GeminiAssistant } from "../components/GeminiAssistant.tsx";
import { ColorPaletteManager } from "../components/ColorPaletteManager.tsx";
import { CursorMagicEffects } from "../components/CursorMagicEffects.tsx";
import { MobileTouchSimulator } from "../components/MobileTouchSimulator.tsx";
import { EasingEditor } from "../components/EasingEditor.tsx";
import { AutoTweenTool } from "../components/AutoTweenTool.tsx";
import { AdvancedToolsStudio } from "../components/AdvancedToolsStudio.tsx";
import { ProjectData, ProjectFrame, ExportHistoryEntry } from "../types.ts";
import { saveProjectToDb, saveExportHistory } from "../db/projects.ts";
import { generateEffectFrames, EffectPreset } from "../engine/effects/index.ts";
import { EasingType } from "../engine/effects/easing.ts";
import { writeCurFile } from "../engine/curWriter.ts";
import { writeAniFile } from "../engine/aniWriter.ts";
import JSZip from "jszip";
import gifshot from "gifshot";
import { User } from "firebase/auth";

interface HotkeyItem {
  keys: string[];
  description: string;
  category: "Drawing Tools" | "Viewport & Overlays" | "Timeline & Navigation" | "History & Editing";
}

const SHORTCUTS: HotkeyItem[] = [
  { keys: ["H"], description: "Activate Hotspot selection tool (set cursor clicking point)", category: "Drawing Tools" },
  { keys: ["P"], description: "Activate Pencil tool (paint sharp individual pixels)", category: "Drawing Tools" },
  { keys: ["S"], description: "Activate Smart Pixel Brush (smooth canvas stroke with curves)", category: "Drawing Tools" },
  { keys: ["F"], description: "Activate Paint Bucket tool (flood fill regions with active color)", category: "Drawing Tools" },
  { keys: ["B"], description: "Activate Paint Bucket tool (alternative shortcut for flood fill)", category: "Drawing Tools" },
  { keys: ["E"], description: "Activate Eraser tool (clear pixel colors to transparency)", category: "Drawing Tools" },
  
  { keys: ["O"], description: "Toggle Previous Frame Onion Skin ghost overlay", category: "Viewport & Overlays" },
  { keys: ["Shift", "O"], description: "Toggle Next Frame Onion Skin ghost overlay", category: "Viewport & Overlays" },
  { keys: ["G"], description: "Toggle Pixel-Perfect alignment grid lines", category: "Viewport & Overlays" },
  { keys: ["-"], description: "Decrease Onion Skin ghost opacity by 5% increments", category: "Viewport & Overlays" },
  { keys: ["+"], description: "Increase Onion Skin ghost opacity by 5% increments", category: "Viewport & Overlays" },

  { keys: ["[", "←"], description: "Navigate to Previous Frame in timeline (Manual Frame Assembly)", category: "Timeline & Navigation" },
  { keys: ["]", "→"], description: "Navigate to Next Frame in timeline (Manual Frame Assembly)", category: "Timeline & Navigation" },
  { keys: ["M"], description: "Apply horizontal mirroring (flip active frame pixels and hotspot horizontally)", category: "Timeline & Navigation" },

  { keys: ["Ctrl", "Z"], description: "Undo last pencil stroke / drawing action in active frame", category: "History & Editing" },
  { keys: ["Ctrl", "Y"], description: "Redo last undone pencil stroke in active frame", category: "History & Editing" },
  { keys: ["Ctrl", "Shift", "Z"], description: "Alternative redo drawing action in active frame", category: "History & Editing" },
];

interface EditorProps {
  user: User | null;
  initialProject: ProjectData;
  onNavigateHome: () => void;
}

export const Editor: React.FC<EditorProps> = ({ user, initialProject, onNavigateHome }) => {
  const [project, setProject] = useState<ProjectData>(initialProject);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [loop, setLoop] = useState<boolean>(true);

  // Auto-Animate configurations
  const [selectedPreset, setSelectedPreset] = useState<EffectPreset>(
    initialProject.effect_preset || "spin"
  );
  const [selectedEasing, setSelectedEasing] = useState<EasingType>(
    initialProject.easing || "linear"
  );
  const [frameCount, setFrameCount] = useState<number>(
    initialProject.frame_count || 18
  );
  const [totalDurationMs, setTotalDurationMs] = useState<number>(
    initialProject.total_duration_ms || 5500
  );

  // Recolor adjustments
  const [hue, setHue] = useState<number>(0);
  const [saturation, setSaturation] = useState<number>(100);
  const [brightness, setBrightness] = useState<number>(100);

  // Undo/Redo frame stack state
  const [framesHistory, setFramesHistory] = useState<ProjectFrame[][]>([initialProject.frames]);
  const [historyPointer, setHistoryPointer] = useState<number>(0);

  // UI States
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(initialProject.palette?.[0] || "#E8793A");
  const [isApplyingTint, setIsApplyingTint] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<"auto" | "manual" | "advanced">((initialProject.mode as any) || "auto");

  // View settings states
  const [onionSkinPrev, setOnionSkinPrev] = useState<boolean>(false);
  const [onionSkinNext, setOnionSkinNext] = useState<boolean>(false);
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(false);
  const [onionSkinOpacity, setOnionSkinOpacity] = useState<number>(0.25);
  const [showViewSettingsDropdown, setShowViewSettingsDropdown] = useState<boolean>(false);

  // Keyboard Shortcuts Modal States
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [shortcutSearchQuery, setShortcutSearchQuery] = useState<string>("");
  const [shortcutActiveCategory, setShortcutActiveCategory] = useState<string>("All");

  const activeFrame = project.frames[activeFrameIndex] || null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Push to Undo Stack
  const updateFramesAndHistory = (newFrames: ProjectFrame[]) => {
    const updatedHistory = framesHistory.slice(0, historyPointer + 1);
    updatedHistory.push(newFrames);
    setFramesHistory(updatedHistory);
    setHistoryPointer(updatedHistory.length - 1);

    setProject((prev) => ({
      ...prev,
      frames: newFrames,
      frame_count: newFrames.length,
    }));
  };

  // Undo triggers
  const handleUndo = () => {
    if (historyPointer > 0) {
      const targetIdx = historyPointer - 1;
      setHistoryPointer(targetIdx);
      const targetFrames = framesHistory[targetIdx];
      setProject((prev) => ({
        ...prev,
        frames: targetFrames,
        frame_count: targetFrames.length,
      }));
      setActiveFrameIndex((prev) => Math.min(prev, targetFrames.length - 1));
      showToast("Undone last change.");
    }
  };

  const handleRedo = () => {
    if (historyPointer < framesHistory.length - 1) {
      const targetIdx = historyPointer + 1;
      setHistoryPointer(targetIdx);
      const targetFrames = framesHistory[targetIdx];
      setProject((prev) => ({
        ...prev,
        frames: targetFrames,
        frame_count: targetFrames.length,
      }));
      setActiveFrameIndex((prev) => Math.min(prev, targetFrames.length - 1));
      showToast("Redone change.");
    }
  };

  // 1.5 Horizontal Flip Helper for M key shortcut
  const handleHorizontalFlip = () => {
    if (!activeFrame) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = activeFrame.width;
      canvas.height = activeFrame.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);

      const newHotspotX = w - 1 - activeFrame.hotspot_x;

      handleFrameUpdated({
        ...activeFrame,
        image_data: canvas.toDataURL("image/png"),
        hotspot_x: Math.max(0, Math.min(w - 1, newHotspotX)),
      });
      showToast("Flipped active frame horizontally!");
    };
    img.src = activeFrame.image_data;
  };

  // Keyboard Event Listeners for Editor Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if user is typing in inputs or textareas
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          (activeElement instanceof HTMLElement && activeElement.isContentEditable) ||
          activeElement.tagName === "SELECT")
      ) {
        return;
      }

      const keyLower = e.key.toLowerCase();

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && keyLower === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && keyLower === "y") {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Frame Navigation
      if (e.key === "ArrowLeft" || e.key === "[") {
        if (activeFrameIndex > 0) {
          e.preventDefault();
          setActiveFrameIndex((prev) => prev - 1);
        }
        return;
      }
      if (e.key === "ArrowRight" || e.key === "]") {
        if (activeFrameIndex < project.frames.length - 1) {
          e.preventDefault();
          setActiveFrameIndex((prev) => prev + 1);
        }
        return;
      }

      // Onion Skin Toggles
      if (keyLower === "o") {
        e.preventDefault();
        if (e.shiftKey) {
          setOnionSkinNext((prev) => !prev);
          showToast(`Next Frame Onion Skin: ${!onionSkinNext ? "Enabled" : "Disabled"}`);
        } else {
          setOnionSkinPrev((prev) => !prev);
          showToast(`Previous Frame Onion Skin: ${!onionSkinPrev ? "Enabled" : "Disabled"}`);
        }
        return;
      }

      // Grid Toggle
      if (keyLower === "g") {
        e.preventDefault();
        setShowGridOverlay((prev) => !prev);
        showToast(`Grid Guides: ${!showGridOverlay ? "Enabled" : "Disabled"}`);
        return;
      }

      // Mirroring Action (M)
      if (keyLower === "m" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleHorizontalFlip();
        return;
      }

      // Onion skin opacity adjustment
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        setOnionSkinOpacity((prev) => Math.min(0.8, Number((prev + 0.05).toFixed(2))));
        return;
      }
      if (e.key === "-") {
        e.preventDefault();
        setOnionSkinOpacity((prev) => Math.max(0.05, Number((prev - 0.05).toFixed(2))));
        return;
      }

      // Shortcuts help toggle
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    activeFrameIndex,
    project.frames.length,
    onionSkinPrev,
    onionSkinNext,
    showGridOverlay,
    historyPointer,
    framesHistory.length,
    activeFrame,
  ]);

  // 2. Procedural effects generator
  const triggerAutoAnimate = () => {
    if (project.mode !== "auto") return;

    // Get pristine frame (typically first frame or original frame)
    // To ensure quality, we find the first frame of our history as the pristine base
    const pristineFrames = framesHistory[0];
    const baseFrame = pristineFrames?.[0] || project.frames[0];
    if (!baseFrame) return;

    const img = new Image();
    img.onload = () => {
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = baseFrame.width;
      sourceCanvas.height = baseFrame.height;
      const srcCtx = sourceCanvas.getContext("2d");
      if (!srcCtx) return;

      // Draw original frame pixels
      srcCtx.drawImage(img, 0, 0);

      const generated = generateEffectFrames(sourceCanvas, baseFrame.hotspot_x, baseFrame.hotspot_y, {
        frameCount,
        effectPreset: selectedPreset,
        easing: selectedEasing,
        seed: 42, // Consistent seed
        accentColor: selectedColor,
        spinAroundHotspot: true,
        hotspotX: baseFrame.hotspot_x,
        hotspotY: baseFrame.hotspot_y,
      });

      // Map to ProjectFrames
      const finalDuration = Math.round(totalDurationMs / frameCount);
      const mapped: ProjectFrame[] = generated.map((g, idx) => ({
        frame_index: idx,
        duration_ms: finalDuration,
        width: g.width,
        height: g.height,
        hotspot_x: g.hotspotX,
        hotspot_y: g.hotspotY,
        image_data: g.dataUrl,
      }));

      // Update project state and push to history
      updateFramesAndHistory(mapped);
    };
    img.src = baseFrame.image_data;
  };

  // Run auto animate whenever parameters change
  useEffect(() => {
    if (project.mode === "auto") {
      triggerAutoAnimate();
    }
  }, [project.mode, selectedPreset, selectedEasing, frameCount, totalDurationMs, selectedColor]);

  // 3. Uniform resize implementation
  const handleAllFramesResized = (size: number) => {
    setIsPlaying(false);
    const updated = project.frames.map((frame) => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      
      const img = new Image();
      // Ensure sync or quick render using canvas
      img.src = frame.image_data;
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        // Wait till loaded before we proceed
        ctx.drawImage(img, 0, 0, size, size);
      }

      return {
        ...frame,
        width: size,
        height: size,
        hotspot_x: Math.round((frame.hotspot_x / frame.width) * size),
        hotspot_y: Math.round((frame.hotspot_y / frame.height) * size),
        image_data: canvas.toDataURL("image/png"),
      };
    });

    updateFramesAndHistory(updated);
    showToast(`Resized all frames to ${size}x${size} pixels.`);
  };

  const handleAllFramesDurationChanged = (durationMs: number) => {
    const updated = project.frames.map((frame) => ({
      ...frame,
      duration_ms: durationMs,
    }));
    updateFramesAndHistory(updated);
    setTotalDurationMs(durationMs * project.frames.length);
    showToast(`Set frame durations to ${durationMs}ms.`);
  };

  const handleFrameUpdated = (updatedFrame: ProjectFrame) => {
    const updated = project.frames.map((f, i) =>
      i === updatedFrame.frame_index ? updatedFrame : f
    );
    updateFramesAndHistory(updated);
  };

  const handleFramesUpdatedFromTimeline = (newFrames: ProjectFrame[]) => {
    updateFramesAndHistory(newFrames);
  };

  // 4. Recolor algorithms
  const applyRecolor = () => {
    // We adjust preview styles via inline filter in active preview, or build it.
    // For ultimate rendering correctness, applying HSB filters onto canvas pixels:
    // Let's do it reactively on slider moves, but wait: updating all frames on slider drag
    // can lag if we have 60 frames. So we apply HSB style to preview, and write it to the actual bytes
    // permanently when clicking "Save" or "Apply Recolor" or "Export"!
  };

  const handleCommitRecolor = () => {
    setIsPlaying(false);
    const promises = project.frames.map((frame) => {
      return new Promise<ProjectFrame>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = frame.width;
          canvas.height = frame.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.filter = `hue-rotate(${hue}deg) saturate(${saturation}%) brightness(${brightness}%)`;
            ctx.drawImage(img, 0, 0);
          }
          resolve({
            ...frame,
            image_data: canvas.toDataURL("image/png"),
          });
        };
        img.src = frame.image_data;
      });
    });

    Promise.all(promises).then((recolored) => {
      updateFramesAndHistory(recolored);
      // Reset sliders
      setHue(0);
      setSaturation(100);
      setBrightness(100);
      showToast("Color filter baked into frames successfully.");
    });
  };

  const resetRecolor = () => {
    setHue(0);
    setSaturation(100);
    setBrightness(100);
  };

  const handleApplyTint = (color: string) => {
    setIsApplyingTint(true);
    setIsPlaying(false);
    
    const promises = project.frames.map((frame) => {
      return new Promise<ProjectFrame>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = frame.width;
          canvas.height = frame.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            // Draw original pixels
            ctx.drawImage(img, 0, 0);
            
            // Apply source-in color tinting
            ctx.save();
            ctx.globalCompositeOperation = "source-in";
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, frame.width, frame.height);
            ctx.restore();
          }
          resolve({
            ...frame,
            image_data: canvas.toDataURL("image/png"),
          });
        };
        img.src = frame.image_data;
      });
    });

    Promise.all(promises).then((tinted) => {
      updateFramesAndHistory(tinted);
      setIsApplyingTint(false);
      showToast(`Applied consistent ${color} tint styling across all frames.`);
    }).catch((err) => {
      console.error(err);
      setIsApplyingTint(false);
      showToast("Failed to apply tint.");
    });
  };

  // 5. Database cloud saving
  const handleSaveProject = async () => {
    setIsSaving(true);
    try {
      const updatedProj: ProjectData = {
        ...project,
        effect_preset: project.mode === "auto" ? selectedPreset : null,
        easing: selectedEasing,
        frame_count: project.frames.length,
        total_duration_ms: totalDurationMs,
        updated_at: new Date().toISOString(),
      };
      await saveProjectToDb(updatedProj, user?.uid);
      setProject(updatedProj);
      showToast(user ? "Saved project to cloud database!" : "Saved draft locally in browser IndexedDB.");
    } catch (err) {
      console.error(err);
      showToast("Failed to save project.");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to adjust bit-depth of cursor frame image
  const processFrameBitDepth = (
    width: number,
    height: number,
    pngDataUrl: string,
    bitDepth: "32" | "24" | "8"
  ): Promise<string> => {
    if (bitDepth === "32") return Promise.resolve(pngDataUrl);

    return new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(pngDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        if (bitDepth === "24") {
          for (let i = 0; i < data.length; i += 4) {
            // Remove transparency by blending with a black background
            const alpha = data[i + 3] / 255;
            data[i] = Math.round(data[i] * alpha);
            data[i + 1] = Math.round(data[i + 1] * alpha);
            data[i + 2] = Math.round(data[i + 2] * alpha);
            data[i + 3] = 255; // opaque
          }
        } else if (bitDepth === "8") {
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 128) {
              data[i + 3] = 0; // Binary transparency threshold
            } else {
              data[i + 3] = 255;
              // Quantize to 256 colors using 3-3-2 bit representation
              data[i] = Math.round(data[i] / 36) * 36;
              data[i + 1] = Math.round(data[i + 1] / 36) * 36;
              data[i + 2] = Math.round(data[i + 2] / 85) * 85;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => {
        resolve(pngDataUrl);
      };
      img.src = pngDataUrl;
    });
  };

  // 6. Binary Compiler triggering from Export modal
  const handleCompileAndDownload = async (
    format: "ani" | "cur" | "gif" | "zip",
    selectedFrameIndices?: number[],
    customDelayOverrideMs?: number | null,
    bitDepth: "32" | "24" | "8" = "32"
  ) => {
    let bytes: Uint8Array = new Uint8Array(0);
    let fileName = project.name.trim().toLowerCase().replace(/\s+/g, "_") || "custom_cursor";
    let actualSizeBytes = 0;

    // Calculate total duration for history
    const totalDuration = format === "cur"
      ? (project.frames[activeFrameIndex] || project.frames[0]).duration_ms
      : (selectedFrameIndices && selectedFrameIndices.length > 0
          ? project.frames.filter((_, idx) => selectedFrameIndices.includes(idx))
          : project.frames
        ).reduce((sum, f) => sum + (customDelayOverrideMs !== null && customDelayOverrideMs !== undefined ? customDelayOverrideMs : f.duration_ms), 0);

    if (format === "cur") {
      // Export single active frame as .cur
      const frame = project.frames[activeFrameIndex] || project.frames[0];
      const processedPng = await processFrameBitDepth(frame.width, frame.height, frame.image_data, bitDepth);
      bytes = writeCurFile(frame.width, frame.height, frame.hotspot_x, frame.hotspot_y, processedPng);
      actualSizeBytes = bytes.length;

      // Trigger Browser Download
      const blob = new Blob([bytes], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Compile selected sequence into .ani, .gif, or .zip (default to all if none specified)
      const targetFrames = selectedFrameIndices && selectedFrameIndices.length > 0
        ? project.frames.filter((_, idx) => selectedFrameIndices.includes(idx))
        : project.frames;

      // Process each frame's bit depth asynchronously in parallel
      const processedFrames = await Promise.all(
        targetFrames.map(async (f) => {
          const processedPng = await processFrameBitDepth(f.width, f.height, f.image_data, bitDepth);
          return {
            width: f.width,
            height: f.height,
            hotspotX: f.hotspot_x,
            hotspotY: f.hotspot_y,
            pngDataUrl: processedPng,
            durationMs: customDelayOverrideMs !== null && customDelayOverrideMs !== undefined
              ? customDelayOverrideMs
              : f.duration_ms,
          };
        })
      );

      if (format === "ani") {
        bytes = writeAniFile(processedFrames);
        actualSizeBytes = bytes.length;

        // Trigger Browser Download
        const blob = new Blob([bytes], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileName}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (format === "zip") {
        const zip = new JSZip();
        processedFrames.forEach((frame, idx) => {
          const base64Data = frame.pngDataUrl.split(",")[1];
          zip.file(`frame_${idx + 1}.png`, base64Data, { base64: true });
        });
        const zipBlob = await zip.generateAsync({ type: "blob" });
        actualSizeBytes = zipBlob.size;

        // Trigger Browser Download
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileName}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (format === "gif") {
        // Create an animated GIF with gifshot
        const gifWidth = targetFrames[0]?.width || 32;
        const gifHeight = targetFrames[0]?.height || 32;

        // Calculate average delay in seconds (gifshot expects seconds per frame)
        const avgDelayMs = processedFrames.reduce((sum, f) => sum + f.durationMs, 0) / processedFrames.length;
        const intervalInSeconds = avgDelayMs / 1000;

        const resultBlob = await new Promise<Blob>((resolve, reject) => {
          gifshot.createGIF(
            {
              images: processedFrames.map((f) => f.pngDataUrl),
              gifWidth,
              gifHeight,
              interval: intervalInSeconds,
              numFrames: processedFrames.length,
            },
            (obj) => {
              if (obj.error) {
                reject(new Error(obj.errorMsg || "GIF compilation failed."));
              } else {
                // Convert base64 image data to a blob
                const byteString = atob(obj.image.split(",")[1]);
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                  ia[i] = byteString.charCodeAt(i);
                }
                resolve(new Blob([ab], { type: "image/gif" }));
              }
            }
          );
        });

        actualSizeBytes = resultBlob.size;

        // Trigger Browser Download
        const url = URL.createObjectURL(resultBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileName}.gif`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }

    // Save to export history
    const historyEntry: ExportHistoryEntry = {
      id: Math.random().toString(36).substring(2, 9),
      project_id: project.id,
      project_name: project.name,
      user_id: user?.uid || null,
      exported_format: format,
      file_size_bytes: actualSizeBytes,
      total_duration_ms: totalDuration,
      exported_at: new Date().toISOString(),
      image_data: project.frames[0]?.image_data || "",
    };
    saveExportHistory(historyEntry, user?.uid);

    return {
      fileName,
      sizeBytes: actualSizeBytes,
      durationMs: totalDuration,
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#1C1512] text-[#F3EDE7]">
      {/* Top Glass Navigation Bar */}
      <nav className="p-4 bg-white/[0.04] backdrop-blur-[24px] border-b border-white/10 flex items-center justify-between shadow-md relative z-10">
        <div className="flex items-center space-x-3">
          <button
            onClick={onNavigateHome}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#B8ADA3] hover:text-white transition-all cursor-pointer"
            title="Back to Home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-white/10"></div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={project.name}
              onChange={(e) => setProject((p) => ({ ...p, name: e.target.value }))}
              className="bg-transparent hover:bg-white/5 focus:bg-black/40 px-2 py-1 rounded border border-transparent focus:border-white/15 text-sm font-bold text-[#F3EDE7] focus:outline-none max-w-[180px] sm:max-w-[240px]"
              title="Click to rename"
            />
            <span className="text-[10px] font-mono uppercase bg-[#6E5A7B]/40 text-[#B8ADA3] px-2 py-0.5 rounded-full border border-[#6E5A7B]/20">
              {project.mode} Mode
            </span>
          </div>
        </div>

        {/* Undo/Redo/Save/Export */}
        <div className="flex items-center space-x-2.5">
          {/* Undo stack controls */}
          <button
            onClick={handleUndo}
            disabled={historyPointer === 0}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#B8ADA3] hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyPointer === framesHistory.length - 1}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#B8ADA3] hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-white/10"></div>

          {/* AI Guide toggle */}
          <button
            onClick={() => setShowAiAssistant(!showAiAssistant)}
            className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              showAiAssistant
                ? "bg-[#6E5A7B] border-[#6E5A7B] text-white"
                : "bg-white/5 border-white/5 text-[#B8ADA3] hover:text-white"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Guide</span>
          </button>

          {/* View Settings Dropdown */}
          <div className="relative">
            <button
              id="view-settings-dropdown-button"
              onClick={() => setShowViewSettingsDropdown(!showViewSettingsDropdown)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                showViewSettingsDropdown
                  ? "bg-[#E8793A] border-[#E8793A] text-[#1C1512]"
                  : "bg-white/5 border-white/5 text-[#B8ADA3] hover:text-white"
              }`}
              title="Configure viewport overlays and onion skin settings"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Settings</span>
            </button>

            {showViewSettingsDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowViewSettingsDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#1C1512] border border-white/10 p-4 shadow-2xl z-50 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#E8793A]" />
                      <span>Onion Skin (Ghosting)</span>
                    </h4>
                    <p className="text-[10px] text-[#B8ADA3] leading-snug mb-3">
                      Overlay adjacent animation frames to track motion increments accurately.
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2.5 cursor-pointer text-xs select-none">
                        <input
                          id="view-settings-onion-prev"
                          type="checkbox"
                          checked={onionSkinPrev}
                          onChange={(e) => setOnionSkinPrev(e.target.checked)}
                          className="rounded border-white/20 bg-neutral-950 text-[#E8793A] focus:ring-[#E8793A] w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="flex items-center gap-1.5 text-[#F3EDE7]">
                          <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                          <span>Previous Frame Ghost</span>
                        </span>
                      </label>

                      <label className="flex items-center space-x-2.5 cursor-pointer text-xs select-none">
                        <input
                          id="view-settings-onion-next"
                          type="checkbox"
                          checked={onionSkinNext}
                          onChange={(e) => setOnionSkinNext(e.target.checked)}
                          className="rounded border-white/20 bg-neutral-950 text-[#E8793A] focus:ring-[#E8793A] w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="flex items-center gap-1.5 text-[#F3EDE7]">
                          <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
                          <span>Next Frame Ghost</span>
                        </span>
                      </label>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono text-[#B8ADA3]">
                        <span>Ghost Opacity</span>
                        <span className="text-[#E8793A] font-bold">{Math.round(onionSkinOpacity * 100)}%</span>
                      </div>
                      <input
                        id="view-settings-onion-opacity"
                        type="range"
                        min="0.05"
                        max="0.8"
                        step="0.05"
                        value={onionSkinOpacity}
                        onChange={(e) => setOnionSkinOpacity(parseFloat(e.target.value))}
                        className="w-full h-1 rounded bg-neutral-900 accent-[#E8793A] cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="h-px bg-white/10"></div>

                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Grid className="w-3.5 h-3.5 text-[#E8793A]" />
                      <span>Grid Guides</span>
                    </h4>
                    <p className="text-[10px] text-[#B8ADA3] leading-snug mb-3">
                      Display pixel boundaries for exact precision while sketching cursor graphics.
                    </p>
                    <label className="flex items-center space-x-2.5 cursor-pointer text-xs select-none">
                      <input
                        id="view-settings-grid"
                        type="checkbox"
                        checked={showGridOverlay}
                        onChange={(e) => setShowGridOverlay(e.target.checked)}
                        className="rounded border-white/20 bg-neutral-950 text-[#E8793A] focus:ring-[#E8793A] w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="text-[#F3EDE7]">Enable Pixel-Perfect Grid</span>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Shortcuts Modal Button */}
          <button
            onClick={() => {
              setShowShortcutsModal(true);
              setShortcutSearchQuery("");
            }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 text-[#B8ADA3] hover:text-white text-xs font-semibold transition-all cursor-pointer"
            title="Show Keyboard Hotkeys & Shortcuts [Shift + ?]"
          >
            <Keyboard className="w-3.5 h-3.5 text-[#E8793A]" />
            <span className="hidden sm:inline">Shortcuts</span>
          </button>

          {/* Save & Compile */}
          <button
            onClick={handleSaveProject}
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save</span>
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#E8793A] hover:bg-[#F2925C] text-[#1C1512] text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-md shadow-[#E8793A]/10 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </nav>

      {/* Main Workspace split */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 p-4 sm:p-6 items-start">
        {/* Left Side: Parameters / Tools Inspector */}
        <div className="md:col-span-6 lg:col-span-3 flex flex-col space-y-6 order-2 lg:order-1">
          <Inspector
            activeFrame={activeFrame}
            onFrameUpdated={handleFrameUpdated}
            onAllFramesResized={handleAllFramesResized}
            onAllFramesDurationChanged={handleAllFramesDurationChanged}
            hue={hue}
            setHue={setHue}
            saturation={saturation}
            setSaturation={setSaturation}
            brightness={brightness}
            setBrightness={setBrightness}
            applyRecolor={handleCommitRecolor}
            resetRecolor={resetRecolor}
          />

          <ColorPaletteManager
            palette={project.palette || []}
            onUpdatePalette={(newPalette) => {
              setProject((p) => ({ ...p, palette: newPalette }));
            }}
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
            onApplyTintToAllFrames={handleApplyTint}
            isApplyingTint={isApplyingTint}
          />

          <CursorMagicEffects
            activeFrame={activeFrame}
            onFrameUpdated={handleFrameUpdated}
            onFramesUpdated={updateFramesAndHistory}
            allFrames={project.frames}
            selectedColor={selectedColor}
            showToast={showToast}
          />

          <MobileTouchSimulator
            activeFrame={activeFrame}
            onFrameUpdated={handleFrameUpdated}
            showToast={showToast}
          />
        </div>

        {/* Center: Live interactive canvas with timeline */}
        <div className="md:col-span-12 lg:col-span-6 flex flex-col space-y-6 order-1 lg:order-2">
          <PreviewCanvas
            frames={project.frames}
            activeFrameIndex={activeFrameIndex}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            speed={speed}
            setSpeed={setSpeed}
            loop={loop}
            setLoop={setLoop}
            onHotspotChanged={(x, y, all) => {
              if (all) {
                const updated = project.frames.map((f) => ({ ...f, hotspot_x: x, hotspot_y: y }));
                updateFramesAndHistory(updated);
                showToast(`Hotspot aligned to (${x}, ${y}) across all frames.`);
              } else if (activeFrame) {
                handleFrameUpdated({ ...activeFrame, hotspot_x: x, hotspot_y: y });
              }
            }}
            onActiveFrameChanged={setActiveFrameIndex}
            hue={hue}
            saturation={saturation}
            brightness={brightness}
            onFrameUpdated={handleFrameUpdated}
            selectedColor={selectedColor}
            onionSkinPrev={onionSkinPrev}
            setOnionSkinPrev={setOnionSkinPrev}
            onionSkinNext={onionSkinNext}
            setOnionSkinNext={setOnionSkinNext}
            showGridOverlay={showGridOverlay}
            onionSkinOpacity={onionSkinOpacity}
          />

          <Timeline
            frames={project.frames}
            activeFrameIndex={activeFrameIndex}
            onActiveFrameChanged={setActiveFrameIndex}
            onFramesUpdated={handleFramesUpdatedFromTimeline}
          />
        </div>

        {/* Right Side: Mode Switcher + Feature Panel */}
        <div className="md:col-span-6 lg:col-span-3 flex flex-col space-y-6 order-3">
          
          {/* Project Mode Quick Segment Select Tab */}
          <div className="p-1 rounded-xl bg-[#1C1512]/90 border border-white/5 flex items-center w-full">
            <button
              onClick={() => {
                setProject((p) => ({ ...p, mode: "auto" }));
                setRightPanelTab("auto");
                showToast("Switched to Auto-Animate Mode.");
              }}
              className={`flex-1 py-2 text-center rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                rightPanelTab === "auto"
                  ? "bg-[#E8793A] text-[#1C1512] shadow-md shadow-[#E8793A]/10"
                  : "text-[#B8ADA3] hover:text-[#F3EDE7] hover:bg-white/[0.03]"
              }`}
            >
              Auto-Animate
            </button>
            <button
              onClick={() => {
                setProject((p) => ({ ...p, mode: "manual" }));
                setRightPanelTab("manual");
                showToast("Switched to Manual Frame Assembly.");
              }}
              className={`flex-1 py-2 text-center rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                rightPanelTab === "manual"
                  ? "bg-[#E8793A] text-[#1C1512] shadow-md shadow-[#E8793A]/10"
                  : "text-[#B8ADA3] hover:text-[#F3EDE7] hover:bg-white/[0.03]"
              }`}
            >
              Manual
            </button>
            <button
              onClick={() => {
                setRightPanelTab("advanced");
                showToast("Switched to Advanced Studio Tools.");
              }}
              className={`flex-1 py-2 text-center rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                rightPanelTab === "advanced"
                  ? "bg-[#E8793A] text-[#1C1512] shadow-md shadow-[#E8793A]/10"
                  : "text-[#B8ADA3] hover:text-[#F3EDE7] hover:bg-white/[0.03]"
              }`}
            >
              Advanced Studio
            </button>
          </div>

          {rightPanelTab === "auto" ? (
            <>
              <EffectGallery
                selectedPreset={selectedPreset}
                onPresetSelected={setSelectedPreset}
                selectedEasing={selectedEasing}
                onEasingSelected={setSelectedEasing}
                frameCount={frameCount}
                onFrameCountChanged={setFrameCount}
                totalDurationMs={totalDurationMs}
                onTotalDurationChanged={setTotalDurationMs}
              />
              <EasingEditor
                selectedEasing={selectedEasing}
                onEasingSelected={setSelectedEasing}
              />
            </>
          ) : rightPanelTab === "manual" ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#6E5A7B]/10 border border-[#6E5A7B]/20 text-xs">
                <h4 className="font-bold text-[#E8793A] mb-1 uppercase tracking-wider">Manual Frame Assembly</h4>
                <p className="text-[#B8ADA3] leading-normal">
                  In Manual Mode, you have full frame-by-frame control. Upload individual static pointers, duplicate them, adjust single hotspot coordinates, or change durations below to build custom frame progressions.
                </p>
              </div>
              <AutoTweenTool
                frames={project.frames}
                activeFrameIndex={activeFrameIndex}
                onFramesUpdated={handleFramesUpdatedFromTimeline}
                showToast={showToast}
              />
              <GeminiAssistant />
            </div>
          ) : (
            <AdvancedToolsStudio
              project={project}
              activeFrame={activeFrame}
              onFrameUpdated={handleFrameUpdated}
              onFramesUpdated={updateFramesAndHistory}
              showToast={showToast}
              selectedColor={selectedColor}
            />
          )}
        </div>
      </div>

      {/* Floating Collapsible AI Guide panel (Drawer overlay if visible) */}
      {showAiAssistant && project.mode === "auto" && (
        <div className="fixed top-20 right-6 w-96 z-40 shadow-2xl">
          <GeminiAssistant />
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showShortcutsModal && (() => {
        const filteredShortcuts = SHORTCUTS.filter((item) => {
          if (shortcutActiveCategory !== "All" && item.category !== shortcutActiveCategory) {
            return false;
          }
          const q = shortcutSearchQuery.toLowerCase().trim();
          if (!q) return true;
          return (
            item.description.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            item.keys.some((k) => k.toLowerCase().includes(q))
          );
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-[#1C1512]/80 backdrop-blur-md transition-opacity"
              onClick={() => setShowShortcutsModal(false)}
            />

            <div className="relative w-full max-w-2xl rounded-2xl bg-[#1C1512] border border-white/10 shadow-2xl p-6 overflow-hidden z-10 flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-white/10">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Keyboard className="w-5 h-5 text-[#E8793A]" />
                    <span>Editor Shortcuts & Hotkeys</span>
                  </h3>
                  <p className="text-xs text-[#B8ADA3]">
                    Supercharge your cursor sketching productivity with single-key controls.
                  </p>
                </div>
                <button
                  onClick={() => setShowShortcutsModal(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-[#B8ADA3] hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Input Bar */}
              <div className="my-4 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B8ADA3]">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={shortcutSearchQuery}
                  onChange={(e) => setShortcutSearchQuery(e.target.value)}
                  placeholder="Search shortcuts (e.g. brush, skin, undo)..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-[#F3EDE7] placeholder-[#B8ADA3] focus:border-[#E8793A] focus:outline-none transition-colors"
                  autoFocus
                />
                {shortcutSearchQuery && (
                  <button
                    onClick={() => setShortcutSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8ADA3] hover:text-white text-xs cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Category Tabs */}
              <div className="flex flex-wrap gap-1.5 pb-3 border-b border-white/5 mb-3">
                {["All", "Drawing Tools", "Viewport & Overlays", "Timeline & Navigation", "History & Editing"].map((cat) => {
                  const isActive = shortcutActiveCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setShortcutActiveCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#E8793A] border-[#E8793A] text-[#1C1512] shadow-sm"
                          : "bg-white/5 border-transparent text-[#B8ADA3] hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Shortcuts list */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                {filteredShortcuts.length > 0 ? (
                  Object.entries(
                    filteredShortcuts.reduce((acc, current) => {
                      if (!acc[current.category]) {
                        acc[current.category] = [];
                      }
                      acc[current.category].push(current);
                      return acc;
                    }, {} as Record<string, HotkeyItem[]>)
                  ).map(([category, items]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-[10px] font-bold text-[#E8793A] uppercase tracking-wider pl-1 pt-1">
                        {category}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {items.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all"
                          >
                            <span className="text-[11px] text-[#F3EDE7] leading-relaxed max-w-[70%]">
                              {item.description}
                            </span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {item.keys.map((key, keyIndex) => (
                                <React.Fragment key={keyIndex}>
                                  {keyIndex > 0 && <span className="text-[10px] text-white/20 font-bold">+</span>}
                                  <kbd className="font-mono px-2 py-0.5 rounded bg-neutral-950 border-b-2 border-white/20 text-[#E8793A] font-bold text-[10px] shadow-md shadow-black min-w-[20px] text-center select-none">
                                    {key}
                                  </kbd>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 space-y-2">
                    <div className="text-[#B8ADA3] text-2xl font-bold">No results found</div>
                    <p className="text-xs text-neutral-500">
                      No hotkeys match your search filter "{shortcutSearchQuery}".
                    </p>
                    <button
                      onClick={() => {
                        setShortcutSearchQuery("");
                        setShortcutActiveCategory("All");
                      }}
                      className="mt-2 px-4 py-1.5 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-[#E8793A] border border-white/10 transition-all cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Footer Tip */}
              <div className="pt-4 border-t border-white/10 text-center text-[10px] text-[#B8ADA3] flex items-center justify-center gap-1.5">
                <span>💡</span>
                <span>
                  Tip: Press <kbd className="font-mono bg-neutral-900 px-1 py-0.5 rounded border border-white/10 text-white font-bold">Shift + ?</kbd> anywhere on the editor workspace to toggle this help menu instantly.
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Export modal dialog */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onDownload={handleCompileAndDownload}
        activeFrameIndex={activeFrameIndex}
        frames={project.frames}
      />

      {/* Toast notifications */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 p-4 rounded-xl bg-neutral-900 border border-white/10 text-xs font-semibold text-[#F3EDE7] shadow-2xl flex items-center space-x-2">
          <Check className="w-4 h-4 text-[#7FBF8E]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
