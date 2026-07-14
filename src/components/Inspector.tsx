import React, { useState } from "react";
import { Sliders, Move, Clock, Percent, Compass, RefreshCw, Download, Image, FlipHorizontal, FlipVertical } from "lucide-react";
import { ProjectFrame } from "../types.ts";

interface InspectorProps {
  activeFrame: ProjectFrame | null;
  onFrameUpdated: (updatedFrame: ProjectFrame) => void;
  onAllFramesResized: (size: number) => void;
  onAllFramesDurationChanged: (durationMs: number) => void;
  // Recolor sliders
  hue: number;
  setHue: (hue: number) => void;
  saturation: number;
  setSaturation: (sat: number) => void;
  brightness: number;
  setBrightness: (bright: number) => void;
  applyRecolor: () => void;
  resetRecolor: () => void;
}

const COLOR_PRESETS = [
  { id: "default", name: "Original / Default", hue: 0, saturation: 100, brightness: 100, category: "Classic" },
  { id: "vivid", name: "Vivid Glow (High Saturation)", hue: 0, saturation: 160, brightness: 110, category: "Creative" },
  { id: "grayscale", name: "Grayscale / B&W", hue: 0, saturation: 0, brightness: 100, category: "Classic" },
  { id: "warm_vintage", name: "Warm Golden Hour", hue: 20, saturation: 130, brightness: 105, category: "Creative" },
  { id: "cool_ocean", name: "Cool Cosmic Blue", hue: 200, saturation: 120, brightness: 95, category: "Creative" },
  { id: "cyberpunk", name: "Cyberpunk Pink-Violet", hue: 300, saturation: 150, brightness: 110, category: "Creative" },
  { id: "sepia", name: "Retro Sepia", hue: 35, saturation: 60, brightness: 90, category: "Classic" },
  { id: "high_contrast", name: "High Contrast Neon", hue: 0, saturation: 170, brightness: 130, category: "Creative" },
  { id: "midnight", name: "Dim Midnight Tint", hue: 240, saturation: 70, brightness: 60, category: "Classic" },
];

const RESIZE_PRESETS = [16, 32, 48, 64, 128];

export const Inspector: React.FC<InspectorProps> = ({
  activeFrame,
  onFrameUpdated,
  onAllFramesResized,
  onAllFramesDurationChanged,
  hue,
  setHue,
  saturation,
  setSaturation,
  brightness,
  setBrightness,
  applyRecolor,
  resetRecolor,
}) => {
  const [mirrorAction, setMirrorAction] = useState<string>("horizontal-flip");
  const [mirrorHotspot, setMirrorHotspot] = useState<boolean>(true);
  const [customSize, setCustomSize] = useState<string>("");

  if (!activeFrame) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full rounded-2xl bg-white/[0.02] border border-white/10 text-center text-[#B8ADA3]">
        <Sliders className="w-10 h-10 mb-2 opacity-30" />
        <span className="text-sm font-medium">No active frame</span>
      </div>
    );
  }

  const handleApplyMirror = () => {
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
      const h = canvas.height;

      if (mirrorAction === "horizontal-flip") {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0);
      } else if (mirrorAction === "vertical-flip") {
        ctx.translate(0, h);
        ctx.scale(1, -1);
        ctx.drawImage(img, 0, 0);
      } else if (mirrorAction === "mirror-left-to-right") {
        ctx.drawImage(img, 0, 0);
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0, w / 2, h, w / 2, 0, w / 2, h);
        ctx.restore();
      } else if (mirrorAction === "mirror-right-to-left") {
        ctx.drawImage(img, 0, 0);
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, w / 2, 0, w / 2, h, 0, 0, w / 2, h);
        ctx.restore();
      } else if (mirrorAction === "mirror-top-to-bottom") {
        ctx.drawImage(img, 0, 0);
        ctx.save();
        ctx.translate(0, h);
        ctx.scale(1, -1);
        ctx.drawImage(img, 0, 0, w, h / 2, 0, h / 2, w, h / 2);
        ctx.restore();
      } else if (mirrorAction === "mirror-bottom-to-top") {
        ctx.drawImage(img, 0, 0);
        ctx.save();
        ctx.translate(0, h);
        ctx.scale(1, -1);
        ctx.drawImage(img, 0, h / 2, w, h / 2, 0, 0, w, h / 2);
        ctx.restore();
      }

      let newHotspotX = activeFrame.hotspot_x;
      let newHotspotY = activeFrame.hotspot_y;

      if (mirrorHotspot) {
        if (mirrorAction === "horizontal-flip") {
          newHotspotX = w - 1 - activeFrame.hotspot_x;
        } else if (mirrorAction === "vertical-flip") {
          newHotspotY = h - 1 - activeFrame.hotspot_y;
        } else if (mirrorAction === "mirror-left-to-right") {
          if (activeFrame.hotspot_x >= w / 2) {
            newHotspotX = w - 1 - activeFrame.hotspot_x;
          }
        } else if (mirrorAction === "mirror-right-to-left") {
          if (activeFrame.hotspot_x < w / 2) {
            newHotspotX = w - 1 - activeFrame.hotspot_x;
          }
        } else if (mirrorAction === "mirror-top-to-bottom") {
          if (activeFrame.hotspot_y >= h / 2) {
            newHotspotY = h - 1 - activeFrame.hotspot_y;
          }
        } else if (mirrorAction === "mirror-bottom-to-top") {
          if (activeFrame.hotspot_y < h / 2) {
            newHotspotY = h - 1 - activeFrame.hotspot_y;
          }
        }
      }

      onFrameUpdated({
        ...activeFrame,
        image_data: canvas.toDataURL("image/png"),
        hotspot_x: Math.max(0, Math.min(w - 1, newHotspotX)),
        hotspot_y: Math.max(0, Math.min(h - 1, newHotspotY)),
      });
    };
    img.src = activeFrame.image_data;
  };

  const handleHotspotXChange = (val: number) => {
    const clamped = Math.max(0, Math.min(activeFrame.width - 1, val));
    onFrameUpdated({
      ...activeFrame,
      hotspot_x: clamped,
    });
  };

  const handleHotspotYChange = (val: number) => {
    const clamped = Math.max(0, Math.min(activeFrame.height - 1, val));
    onFrameUpdated({
      ...activeFrame,
      hotspot_y: clamped,
    });
  };

  const handleDurationChange = (val: number) => {
    const clamped = Math.max(16, val); // Minimum 16ms (~1 frame at 60fps)
    onFrameUpdated({
      ...activeFrame,
      duration_ms: clamped,
    });
  };

  const handleDownloadActivePng = () => {
    if (!activeFrame) return;
    const link = document.createElement("a");
    link.href = activeFrame.image_data;
    link.download = `frame_${activeFrame.frame_index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col space-y-6 p-5 rounded-2xl bg-white/[0.02] border border-white/10">
      <div className="flex items-center space-x-2 text-[#F3EDE7]">
        <Sliders className="w-4.5 h-4.5 text-[#E8793A]" />
        <h3 className="font-bold text-sm tracking-tight">Inspector & Tools</h3>
      </div>

      <div className="h-px bg-white/10 w-full"></div>

      {/* 1. Hotspot Positioning */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-[#F3EDE7] flex items-center gap-1.5 uppercase tracking-wider">
          <Move className="w-3.5 h-3.5 text-[#E8793A]" />
          <span>Hotspot Coordinate</span>
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-[#B8ADA3] font-mono">X Pixels (0-{activeFrame.width - 1})</label>
            <input
              type="number"
              value={activeFrame.hotspot_x}
              onChange={(e) => handleHotspotXChange(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-sm font-mono text-[#F3EDE7] focus:border-[#E8793A] focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-[#B8ADA3] font-mono">Y Pixels (0-{activeFrame.height - 1})</label>
            <input
              type="number"
              value={activeFrame.hotspot_y}
              onChange={(e) => handleHotspotYChange(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-sm font-mono text-[#F3EDE7] focus:border-[#E8793A] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Frame Timing */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-[#F3EDE7] flex items-center gap-1.5 uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5 text-[#E8793A]" />
          <span>Frame Duration</span>
        </h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <input
              type="number"
              value={activeFrame.duration_ms}
              onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0)}
              className="w-2/3 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-sm font-mono text-[#F3EDE7] focus:border-[#E8793A] focus:outline-none"
            />
            <span className="text-xs font-mono text-[#B8ADA3]">ms</span>
          </div>

          <button
            onClick={() => onAllFramesDurationChanged(activeFrame.duration_ms)}
            className="w-full py-1.5 rounded-lg bg-white/[0.04] hover:bg-[#6E5A7B]/40 text-[11px] font-medium border border-white/5 text-[#F3EDE7] transition-all cursor-pointer"
          >
            Apply this duration to ALL frames
          </button>
        </div>
      </div>

      {/* 3. Resize Presets */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-[#F3EDE7] flex items-center gap-1.5 uppercase tracking-wider">
          <Percent className="w-3.5 h-3.5 text-[#E8793A]" />
          <span>Uniform Resize</span>
        </h4>
        <div className="grid grid-cols-5 gap-1.5">
          {RESIZE_PRESETS.map((size) => {
            const isCurrent = activeFrame.width === size && activeFrame.height === size;
            return (
              <button
                key={size}
                onClick={() => onAllFramesResized(size)}
                className={`py-1.5 rounded-lg font-mono text-[10px] font-bold transition-all border cursor-pointer ${
                  isCurrent
                    ? "bg-[#E8793A] border-[#E8793A] text-[#1C1512]"
                    : "bg-[#1C1512] border-white/10 text-[#B8ADA3] hover:bg-white/[0.04] hover:text-[#F3EDE7]"
                }`}
              >
                {size}px
              </button>
            );
          })}
        </div>

        {/* Custom Digit Value Input */}
        <div className="flex items-center space-x-2 mt-2">
          <input
            type="number"
            min="4"
            max="512"
            value={customSize}
            onChange={(e) => setCustomSize(e.target.value)}
            placeholder="Custom px (e.g. 32)"
            className="flex-1 bg-[#1C1512] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-[#F3EDE7] font-mono placeholder-[#B8ADA3]/40 focus:outline-none focus:border-[#E8793A]/50"
          />
          <button
            onClick={() => {
              const val = parseInt(customSize, 10);
              if (val >= 4 && val <= 512) {
                onAllFramesResized(val);
              }
            }}
            disabled={!customSize || isNaN(parseInt(customSize, 10)) || parseInt(customSize, 10) < 4 || parseInt(customSize, 10) > 512}
            className="px-3 py-1.5 bg-white/10 hover:bg-[#E8793A] hover:text-[#1C1512] disabled:opacity-40 disabled:hover:bg-white/10 disabled:hover:text-[#F3EDE7] rounded-lg text-xs font-bold font-mono transition-colors border border-white/5 cursor-pointer text-[#F3EDE7]"
          >
            Apply
          </button>
        </div>

        <p className="text-[10px] text-[#B8ADA3] font-sans leading-relaxed">
          Windows requires identical dimensions across all .ani embedded frames. Selecting a preset or entering a custom size resizes all frames instantly.
        </p>
      </div>

      {/* Mirroring & Symmetry Tool */}
      <div id="mirroring-tool-section" className="space-y-3 p-3.5 rounded-xl bg-white/[0.01] border border-white/5">
        <h4 className="text-xs font-bold text-[#F3EDE7] flex items-center gap-1.5 uppercase tracking-wider">
          <FlipHorizontal className="w-3.5 h-3.5 text-[#E8793A]" />
          <span>Mirroring & Symmetry</span>
        </h4>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#B8ADA3] uppercase tracking-wider block">Flip/Mirror Operation</label>
            <select
              id="mirror-action-select"
              value={mirrorAction}
              onChange={(e) => setMirrorAction(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-[#F3EDE7] focus:border-[#E8793A] focus:outline-none cursor-pointer font-bold"
            >
              <option value="horizontal-flip" className="bg-[#1C1512]">Flip Horizontally (↔)</option>
              <option value="vertical-flip" className="bg-[#1C1512]">Flip Vertically (↕)</option>
              <option value="mirror-left-to-right" className="bg-[#1C1512]">Mirror Left to Right (▶◀)</option>
              <option value="mirror-right-to-left" className="bg-[#1C1512]">Mirror Right to Left (◀▶)</option>
              <option value="mirror-top-to-bottom" className="bg-[#1C1512]">Mirror Top to Bottom (▼▲)</option>
              <option value="mirror-bottom-to-top" className="bg-[#1C1512]">Mirror Bottom to Top (▲▼)</option>
            </select>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              id="mirror-hotspot-checkbox"
              type="checkbox"
              checked={mirrorHotspot}
              onChange={(e) => setMirrorHotspot(e.target.checked)}
              className="accent-[#E8793A] rounded border-white/20 bg-neutral-950 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-[#B8ADA3] text-[10px] font-semibold">Also adjust hotspot coordinate</span>
          </label>

          <button
            id="apply-mirror-button"
            onClick={handleApplyMirror}
            className="w-full py-2.5 rounded-lg bg-[#E8793A]/10 hover:bg-[#E8793A]/20 text-[#E8793A] border border-[#E8793A]/30 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            <span>Apply Mirror Reflection</span>
          </button>
        </div>
      </div>

      {/* 4. Image Adjustments */}
      <div id="image-adjustments-section" className="space-y-4 pt-1">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#F3EDE7] flex items-center gap-1.5 uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5 text-[#E8793A]" />
            <span>Image Adjustments</span>
          </h4>
          <button
            onClick={resetRecolor}
            className="p-1 rounded hover:bg-white/10 text-[#B8ADA3] hover:text-white transition-colors cursor-pointer"
            title="Reset adjustments"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Dropdown Select for Colors */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[#B8ADA3] uppercase tracking-wider block">Quick Color Preset</label>
          <select
            value={(() => {
              const matched = COLOR_PRESETS.find(
                (p) => p.hue === hue && p.saturation === saturation && p.brightness === brightness
              );
              return matched ? matched.id : "custom";
            })()}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "custom") return;
              const matched = COLOR_PRESETS.find((p) => p.id === val);
              if (matched) {
                setHue(matched.hue);
                setSaturation(matched.saturation);
                setBrightness(matched.brightness);
              }
            }}
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-[#F3EDE7] focus:border-[#E8793A] focus:outline-none cursor-pointer font-bold"
          >
            <option value="custom" className="bg-[#1C1512] text-[#B8ADA3] font-semibold">Custom Adjustments...</option>
            <optgroup label="✨ CREATIVE COLORS" className="text-[#E8793A] font-bold bg-[#1C1512]">
              {COLOR_PRESETS.filter(p => p.category === "Creative").map((p) => (
                <option key={p.id} value={p.id} className="bg-[#1C1512] text-[#F3EDE7] font-semibold">
                  {p.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="⚡ CLASSIC COLORS" className="text-[#B8ADA3] font-bold bg-[#1C1512]">
              {COLOR_PRESETS.filter(p => p.category === "Classic").map((p) => (
                <option key={p.id} value={p.id} className="bg-[#1C1512] text-[#F3EDE7] font-semibold">
                  {p.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Hue Slider with Rainbow Track */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-mono font-semibold text-[#B8ADA3]">
            <span>Hue Rotation</span>
            <span className="text-[#E8793A] font-bold">{hue}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={(e) => {
              setHue(parseInt(e.target.value));
            }}
            className="w-full h-2 rounded-lg cursor-pointer appearance-none accent-white border border-white/10"
            style={{
              background: "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
            }}
          />
        </div>

        {/* Larger, Prominent Saturation Control Container for Precise Adjustments */}
        <div id="saturation-control-container" className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#F3EDE7] uppercase tracking-wider">
              🎨 Saturation Control
            </span>
            <div className="flex items-center space-x-1">
              <input
                id="saturation-numerical-input"
                type="number"
                min="0"
                max="200"
                value={saturation}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(200, parseInt(e.target.value) || 0));
                  setSaturation(val);
                }}
                className="w-14 px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-xs font-mono font-bold text-[#E8793A] text-center focus:border-[#E8793A] focus:outline-none"
              />
              <span className="text-[10px] text-[#B8ADA3] font-mono font-bold">%</span>
            </div>
          </div>

          <input
            id="saturation-large-slider"
            type="range"
            min="0"
            max="200"
            value={saturation}
            onChange={(e) => {
              setSaturation(parseInt(e.target.value));
            }}
            className="w-full h-3 rounded-lg cursor-pointer appearance-none accent-[#E8793A] border border-white/10 transition-all hover:scale-[1.01]"
            style={{
              background: "linear-gradient(to right, #4b5563 0%, #e8793a 50%, #ea580c 100%)",
            }}
          />

          {/* Micro fine-tuning increment/decrement controls */}
          <div className="flex items-center justify-between gap-1 pt-1">
            <button
              onClick={() => setSaturation(Math.max(0, saturation - 10))}
              className="flex-1 py-1 px-1 rounded bg-[#1C1512] hover:bg-white/5 border border-white/5 text-[9px] font-mono text-[#B8ADA3] hover:text-white transition-all active:scale-95"
              title="Decrease Saturation by 10%"
            >
              -10%
            </button>
            <button
              onClick={() => setSaturation(Math.max(0, saturation - 1))}
              className="flex-1 py-1 px-1 rounded bg-[#1C1512] hover:bg-white/5 border border-white/5 text-[9px] font-mono text-[#B8ADA3] hover:text-white transition-all active:scale-95"
              title="Decrease Saturation by 1%"
            >
              -1%
            </button>
            <button
              onClick={() => setSaturation(100)}
              className="px-2 py-1 rounded bg-[#E8793A]/10 hover:bg-[#E8793A]/20 border border-[#E8793A]/20 text-[9px] font-bold text-[#E8793A] transition-all active:scale-95"
              title="Reset Saturation to 100% (Default)"
            >
              Reset
            </button>
            <button
              onClick={() => setSaturation(Math.min(200, saturation + 1))}
              className="flex-1 py-1 px-1 rounded bg-[#1C1512] hover:bg-white/5 border border-white/5 text-[9px] font-mono text-[#B8ADA3] hover:text-white transition-all active:scale-95"
              title="Increase Saturation by 1%"
            >
              +1%
            </button>
            <button
              onClick={() => setSaturation(Math.min(200, saturation + 10))}
              className="flex-1 py-1 px-1 rounded bg-[#1C1512] hover:bg-white/5 border border-white/5 text-[9px] font-mono text-[#B8ADA3] hover:text-white transition-all active:scale-95"
              title="Increase Saturation by 10%"
            >
              +10%
            </button>
          </div>
        </div>

        {/* Brightness Slider with Light-to-Dark Track */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-mono font-semibold text-[#B8ADA3]">
            <span>Brightness</span>
            <span className="text-[#E8793A] font-bold">{brightness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={brightness}
            onChange={(e) => {
              setBrightness(parseInt(e.target.value));
            }}
            className="w-full h-2 rounded-lg cursor-pointer appearance-none accent-white border border-white/10"
            style={{
              background: "linear-gradient(to right, #000000 0%, #6b7280 50%, #ffffff 100%)",
            }}
          />
        </div>

        {/* Apply/Bake button */}
        <button
          onClick={applyRecolor}
          disabled={hue === 0 && saturation === 100 && brightness === 100}
          className="w-full py-2.5 rounded-lg bg-[#E8793A]/10 hover:bg-[#E8793A]/20 text-[#E8793A] border border-[#E8793A]/30 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>Apply & Bake Colors to Frames</span>
        </button>
      </div>

      {/* 5. Individual Frame Export */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-[#F3EDE7] flex items-center gap-1.5 uppercase tracking-wider">
          <Image className="w-3.5 h-3.5 text-[#E8793A]" />
          <span>Active Frame Actions</span>
        </h4>
        <button
          onClick={handleDownloadActivePng}
          className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-white/[0.05] hover:bg-[#E8793A]/20 hover:text-[#E8793A] text-xs font-semibold border border-white/5 text-[#F3EDE7] transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Current Frame as PNG</span>
        </button>
      </div>
    </div>
  );
};
