import React, { useState } from "react";
import { Wand2, Wind, Sparkles, Crop, RefreshCw, Layers, CheckCircle } from "lucide-react";
import { GlassPanel } from "./GlassPanel.tsx";
import { ProjectFrame } from "../types.ts";
import { motion } from "motion/react";

interface CursorMagicEffectsProps {
  activeFrame: ProjectFrame | null;
  onFrameUpdated: (updatedFrame: ProjectFrame) => void;
  onFramesUpdated: (updatedFrames: ProjectFrame[]) => void;
  allFrames: ProjectFrame[];
  selectedColor: string;
  showToast: (msg: string) => void;
}

export const CursorMagicEffects: React.FC<CursorMagicEffectsProps> = ({
  activeFrame,
  onFrameUpdated,
  onFramesUpdated,
  allFrames,
  selectedColor,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<"glow" | "trail" | "trim">("glow");
  const [glowSize, setGlowSize] = useState<number>(2);
  const [glowColor, setGlowColor] = useState<string>("#E8793A");
  const [glowOpacity, setGlowOpacity] = useState<number>(0.8);
  const [applyToAll, setApplyToAll] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Trail configs
  const [trailDirection, setTrailDirection] = useState<"left" | "right" | "up" | "down" | "up-left" | "down-right">("down-right");
  const [trailLength, setTrailLength] = useState<number>(3);
  const [trailSpacing, setTrailSpacing] = useState<number>(2);

  if (!activeFrame) {
    return (
      <GlassPanel className="p-5 text-center text-[#B8ADA3] border border-white/5" intensity="low">
        <Wand2 className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#E8793A]" />
        <p className="text-xs font-semibold">Select a frame to access Cursor Magic FX</p>
      </GlassPanel>
    );
  }

  // Helper to load image
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  };

  // FX 1: Glow / Neon Outline
  const applyGlowFx = async () => {
    setIsProcessing(true);
    try {
      const framesToProcess = applyToAll ? allFrames : [activeFrame];
      const updatedFramesList: ProjectFrame[] = [];

      for (const frame of framesToProcess) {
        const img = await loadImage(frame.image_data);
        const canvas = document.createElement("canvas");
        canvas.width = frame.width;
        canvas.height = frame.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        ctx.imageSmoothingEnabled = false;

        // 1. Create solid color silhouette of the original image
        const silCanvas = document.createElement("canvas");
        silCanvas.width = frame.width;
        silCanvas.height = frame.height;
        const silCtx = silCanvas.getContext("2d");
        if (silCtx) {
          silCtx.imageSmoothingEnabled = false;
          silCtx.drawImage(img, 0, 0);
          silCtx.globalCompositeOperation = "source-in";
          silCtx.fillStyle = glowColor;
          silCtx.fillRect(0, 0, frame.width, frame.height);
        }

        // 2. Draw the silhouette repeatedly offset to create an outline glow
        ctx.globalAlpha = glowOpacity;
        const radius = glowSize;
        for (let x = -radius; x <= radius; x++) {
          for (let y = -radius; y <= radius; y++) {
            // Check distance to keep it roundish
            if (x * x + y * y <= radius * radius) {
              ctx.drawImage(silCanvas, x, y);
            }
          }
        }

        // 3. Draw original image on top
        ctx.globalAlpha = 1.0;
        ctx.drawImage(img, 0, 0);

        updatedFramesList.push({
          ...frame,
          image_data: canvas.toDataURL("image/png"),
        });
      }

      if (applyToAll) {
        onFramesUpdated(updatedFramesList);
        showToast(`Applied Neon Glow outline to all ${updatedFramesList.length} frames!`);
      } else {
        onFrameUpdated(updatedFramesList[0]);
        showToast("Applied Neon Glow outline to active frame!");
      }
    } catch (err) {
      console.error(err);
      showToast("Glow FX failed to compile.");
    } finally {
      setIsProcessing(false);
    }
  };

  // FX 2: Wind Trail Motion Smear
  const applyTrailFx = async () => {
    setIsProcessing(true);
    try {
      const framesToProcess = applyToAll ? allFrames : [activeFrame];
      const updatedFramesList: ProjectFrame[] = [];

      for (const frame of framesToProcess) {
        const img = await loadImage(frame.image_data);
        const canvas = document.createElement("canvas");
        canvas.width = frame.width;
        canvas.height = frame.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        ctx.imageSmoothingEnabled = false;

        // Determine offset step based on direction
        let dx = 0;
        let dy = 0;
        if (trailDirection === "left") dx = -1;
        else if (trailDirection === "right") dx = 1;
        else if (trailDirection === "up") dy = -1;
        else if (trailDirection === "down") dy = 1;
        else if (trailDirection === "up-left") { dx = -1; dy = -1; }
        else if (trailDirection === "down-right") { dx = 1; dy = 1; }

        // Draw background shadow steps
        for (let i = trailLength; i > 0; i--) {
          const shiftAmount = i * trailSpacing;
          ctx.globalAlpha = 0.45 / i; // fading trail
          ctx.drawImage(img, -dx * shiftAmount, -dy * shiftAmount);
        }

        // Draw main crisp frame on top
        ctx.globalAlpha = 1.0;
        ctx.drawImage(img, 0, 0);

        updatedFramesList.push({
          ...frame,
          image_data: canvas.toDataURL("image/png"),
        });
      }

      if (applyToAll) {
        onFramesUpdated(updatedFramesList);
        showToast(`Generated wind smear trails for all ${updatedFramesList.length} frames.`);
      } else {
        onFrameUpdated(updatedFramesList[0]);
        showToast("Applied motion trail to active frame.");
      }
    } catch (err) {
      console.error(err);
      showToast("Trail FX generation failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  // FX 3: Auto-Trim & Hotspot-Preserving Alignment
  const applyAutoTrimFx = async () => {
    setIsProcessing(true);
    try {
      const framesToProcess = applyToAll ? allFrames : [activeFrame];
      const updatedFramesList: ProjectFrame[] = [];

      for (const frame of framesToProcess) {
        const img = await loadImage(frame.image_data);
        const canvas = document.createElement("canvas");
        canvas.width = frame.width;
        canvas.height = frame.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, frame.width, frame.height);
        const data = imgData.data;

        // Compute Bounding Box
        let minX = frame.width;
        let minY = frame.height;
        let maxX = -1;
        let maxY = -1;

        for (let y = 0; y < frame.height; y++) {
          for (let x = 0; x < frame.width; x++) {
            const alphaIndex = (y * frame.width + x) * 4 + 3;
            if (data[alphaIndex] > 0) {
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          }
        }

        // Empty frame check
        if (maxX === -1) {
          updatedFramesList.push(frame); // unchanged if empty
          continue;
        }

        const contentW = maxX - minX + 1;
        const contentH = maxY - minY + 1;

        // Create target centered canvas
        const targetCanvas = document.createElement("canvas");
        targetCanvas.width = frame.width;
        targetCanvas.height = frame.height;
        const targetCtx = targetCanvas.getContext("2d");
        if (!targetCtx) continue;
        targetCtx.imageSmoothingEnabled = false;

        // Coordinates to draw the content centered
        const targetX = Math.floor((frame.width - contentW) / 2);
        const targetY = Math.floor((frame.height - contentH) / 2);

        // Copy cropped region
        targetCtx.drawImage(
          img,
          minX,
          minY,
          contentW,
          contentH,
          targetX,
          targetY,
          contentW,
          contentH
        );

        // Recalculate hotspot so it points to the exact same visual pixel
        const shiftX = targetX - minX;
        const shiftY = targetY - minY;

        const newHotspotX = Math.max(0, Math.min(frame.width - 1, frame.hotspot_x + shiftX));
        const newHotspotY = Math.max(0, Math.min(frame.height - 1, frame.hotspot_y + shiftY));

        updatedFramesList.push({
          ...frame,
          image_data: targetCanvas.toDataURL("image/png"),
          hotspot_x: newHotspotX,
          hotspot_y: newHotspotY,
        });
      }

      if (applyToAll) {
        onFramesUpdated(updatedFramesList);
        showToast(`Auto-cropped & centered all ${updatedFramesList.length} cursor canvases.`);
      } else {
        onFrameUpdated(updatedFramesList[0]);
        showToast("Auto-trimmed & centered drawing with hotspot adjusted!");
      }
    } catch (err) {
      console.error(err);
      showToast("Auto-crop optimization failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <GlassPanel className="p-4 border border-white/10 space-y-4 shadow-xl" intensity="medium">
      {/* Header */}
      <div className="flex items-center space-x-2 pb-2 border-b border-white/5">
        <Wand2 className="w-4 h-4 text-[#E8793A]" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">Cursor Magic FX Studio</h3>
      </div>

      {/* Tabs */}
      <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
        <button
          onClick={() => setActiveTab("glow")}
          className={`flex-1 py-1.5 text-center rounded-md text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === "glow" ? "bg-[#E8793A] text-[#1C1512]" : "text-[#B8ADA3] hover:text-white"
          }`}
        >
          Neon Glow
        </button>
        <button
          onClick={() => setActiveTab("trail")}
          className={`flex-1 py-1.5 text-center rounded-md text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === "trail" ? "bg-[#E8793A] text-[#1C1512]" : "text-[#B8ADA3] hover:text-white"
          }`}
        >
          Wind Trail
        </button>
        <button
          onClick={() => setActiveTab("trim")}
          className={`flex-1 py-1.5 text-center rounded-md text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === "trim" ? "bg-[#E8793A] text-[#1C1512]" : "text-[#B8ADA3] hover:text-white"
          }`}
        >
          Auto-Trim
        </button>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[140px] flex flex-col justify-between">
        {activeTab === "glow" && (
          <div className="space-y-3">
            <p className="text-[10px] text-[#B8ADA3] leading-snug">
              Adds a professional custom-colored outer glow or neon boundary outline to your cursor pixels.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-neutral-400 uppercase">Glow Radius</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="1"
                    value={glowSize}
                    onChange={(e) => setGlowSize(parseInt(e.target.value))}
                    className="w-full h-1 bg-black/40 rounded accent-[#E8793A] cursor-pointer"
                  />
                  <span className="text-[10px] font-mono font-bold text-white">{glowSize}px</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-neutral-400 uppercase">Glow Color</label>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="color"
                    value={glowColor}
                    onChange={(e) => setGlowColor(e.target.value)}
                    className="w-6 h-6 rounded border border-white/20 bg-transparent cursor-pointer"
                  />
                  <button
                    onClick={() => setGlowColor(selectedColor)}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[9px] font-semibold text-[#E8793A] transition-all cursor-pointer"
                    title="Match Palette Color"
                  >
                    Match
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-neutral-400 uppercase flex justify-between">
                <span>Opacity</span>
                <span className="font-mono text-white">{Math.round(glowOpacity * 100)}%</span>
              </label>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.1"
                value={glowOpacity}
                onChange={(e) => setGlowOpacity(parseFloat(e.target.value))}
                className="w-full h-1 bg-black/40 rounded accent-[#E8793A] cursor-pointer"
              />
            </div>
          </div>
        )}

        {activeTab === "trail" && (
          <div className="space-y-3">
            <p className="text-[10px] text-[#B8ADA3] leading-snug">
              Procedurally builds aerodynamic speed smears and direction motion trails behind the active cursor design.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-neutral-400 uppercase">Trail Length</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={trailLength}
                    onChange={(e) => setTrailLength(parseInt(e.target.value))}
                    className="w-full h-1 bg-black/40 rounded accent-[#E8793A] cursor-pointer"
                  />
                  <span className="text-[10px] font-mono font-bold text-white">{trailLength}x</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-neutral-400 uppercase">Spurt Spacing</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="1"
                    value={trailSpacing}
                    onChange={(e) => setTrailSpacing(parseInt(e.target.value))}
                    className="w-full h-1 bg-black/40 rounded accent-[#E8793A] cursor-pointer"
                  />
                  <span className="text-[10px] font-mono font-bold text-white">{trailSpacing}px</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-neutral-400 uppercase block">Trail Direction</label>
              <select
                value={trailDirection}
                onChange={(e: any) => setTrailDirection(e.target.value)}
                className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/10 text-[10px] text-white focus:outline-none focus:border-[#E8793A]"
              >
                <option value="down-right">Down-Right (Classical Diagonal)</option>
                <option value="left">Left (Speed Sweep)</option>
                <option value="right">Right (Inverse Sweep)</option>
                <option value="up">Up (Ascent Trails)</option>
                <option value="down">Down (Gravity Pull)</option>
                <option value="up-left">Up-Left (North West)</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === "trim" && (
          <div className="space-y-3">
            <p className="text-[10px] text-[#B8ADA3] leading-snug">
              Scans your canvas for actual drawings, auto-crops transparent empty borders, centers the artwork inside 32x32 limits, and **automatically recalculates your Hotspot click coordinate** so clicking never offsets!
            </p>

            <div className="p-2.5 rounded-lg bg-[#E8793A]/5 border border-[#E8793A]/10 text-[9px] text-[#B8ADA3] leading-normal flex items-start gap-1.5">
              <span className="text-xs">💡</span>
              <span>
                Ideal for fixing offset issues after sketching or drawing smaller cursor pointers with massive empty boundaries.
              </span>
            </div>
          </div>
        )}

        {/* Global Action controls */}
        <div className="pt-3 border-t border-white/5 space-y-2">
          {/* Target Scope Checkbox */}
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
              className="rounded border-white/20 bg-neutral-950 text-[#E8793A] focus:ring-[#E8793A] w-3 h-3 cursor-pointer"
            />
            <span className="text-[9px] font-bold uppercase tracking-wide text-[#B8ADA3]">
              Apply to all {allFrames.length} animation frames
            </span>
          </label>

          {/* Action Trigger Button */}
          <button
            onClick={
              activeTab === "glow"
                ? applyGlowFx
                : activeTab === "trail"
                ? applyTrailFx
                : applyAutoTrimFx
            }
            disabled={isProcessing}
            className="w-full py-2 bg-[#E8793A] hover:bg-[#F2925C] disabled:opacity-40 text-[#1C1512] font-bold rounded-xl text-xs transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-1.5 shadow-lg shadow-[#E8793A]/15 cursor-pointer"
          >
            {isProcessing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : activeTab === "trim" ? (
              <Crop className="w-3.5 h-3.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>
              {isProcessing
                ? "Compiling FX..."
                : activeTab === "glow"
                ? "Render Glow Outline"
                : activeTab === "trail"
                ? "Generate Motion Trail"
                : "Optimize & Recenter Hotspot"}
            </span>
          </button>
        </div>
      </div>
    </GlassPanel>
  );
};
