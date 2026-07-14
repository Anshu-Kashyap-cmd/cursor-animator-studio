import React, { useState, useEffect } from "react";
import { Sparkles, Activity, Clock, Layers, Move, RefreshCw, HelpCircle, ArrowRight, RotateCw, ZoomIn } from "lucide-react";
import { ProjectFrame } from "../types.ts";
import { EasingType, applyEasing } from "../engine/effects/easing.ts";

interface AutoTweenToolProps {
  frames: ProjectFrame[];
  activeFrameIndex: number;
  onFramesUpdated: (newFrames: ProjectFrame[]) => void;
  showToast: (msg: string) => void;
}

const TWEEN_EASING_PRESETS = [
  { id: "linear", name: "Linear", value: "linear", desc: "Constant speed, straight cross-fade" },
  { id: "ease-in", name: "Ease-In", value: "ease-in", desc: "Accelerates toward the end" },
  { id: "ease-out", name: "Ease-Out", value: "ease-out", desc: "Decelerates toward the end" },
  { id: "ease-in-out", name: "Ease-In-Out", value: "ease-in-out", desc: "Slow start and end, fast middle" },
  { id: "ease-in-back", name: "Anticipation (In-Back)", value: "cubic-bezier(0.36, 0, 0.66, -0.56)", desc: "Slight fallback before moving forward" },
  { id: "ease-out-back", name: "Overshoot (Out-Back)", value: "cubic-bezier(0.34, 1.56, 0.64, 1)", desc: "Gently overshoots keyframe B before landing" },
  { id: "ease-in-out-back", name: "Wind-up & Bounce", value: "cubic-bezier(0.68, -0.6, 0.32, 1.6)", desc: "Anticipation pull-back with overshoot landing" },
  { id: "elastic-out", name: "Elastic Bounce", value: "elastic-out", desc: "Decelerating spring-like oscillation physics" },
  { id: "bounce-out", name: "Gravity Bounce", value: "bounce-out", desc: "Simulates multiple hard ground collisions" },
];

export const AutoTweenTool: React.FC<AutoTweenToolProps> = ({
  frames,
  activeFrameIndex,
  onFramesUpdated,
  showToast,
}) => {
  // Keyframe targets
  const [startFrameIdx, setStartFrameIdx] = useState<number>(0);
  const [endFrameIdx, setEndFrameIdx] = useState<number>(1);
  const [numFramesToInsert, setNumFramesToInsert] = useState<number>(5);
  const [easingType, setEasingType] = useState<EasingType>("ease-in-out");

  // Interpolation properties toggles
  const [interpolateOpacity, setInterpolateOpacity] = useState<boolean>(true); // Cross-fade
  const [interpolateHotspot, setInterpolateHotspot] = useState<boolean>(true);
  const [interpolateDuration, setInterpolateDuration] = useState<boolean>(true);

  // Motion Translation Options
  const [useTranslation, setUseTranslation] = useState<boolean>(false);
  const [translateX, setTranslateX] = useState<number>(0);
  const [translateY, setTranslateY] = useState<number>(0);
  const [translateEndX, setTranslateEndX] = useState<number>(0);
  const [translateEndY, setTranslateEndY] = useState<number>(0);

  // Advanced Transforms
  const [useRotation, setUseRotation] = useState<boolean>(false);
  const [startRotation, setStartRotation] = useState<number>(0);
  const [endRotation, setEndRotation] = useState<number>(360);

  const [useScale, setUseScale] = useState<boolean>(false);
  const [startScale, setStartScale] = useState<number>(1.0);
  const [endScale, setEndScale] = useState<number>(1.0);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Automatically keep selection rational
  useEffect(() => {
    if (activeFrameIndex < frames.length) {
      setStartFrameIdx(activeFrameIndex);
      if (activeFrameIndex + 1 < frames.length) {
        setEndFrameIdx(activeFrameIndex + 1);
      } else if (activeFrameIndex - 1 >= 0) {
        setEndFrameIdx(activeFrameIndex);
        setStartFrameIdx(activeFrameIndex - 1);
      } else {
        setEndFrameIdx(0);
      }
    }
  }, [activeFrameIndex, frames.length]);

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  };

  const handleGenerateTween = async () => {
    if (startFrameIdx === endFrameIdx) {
      showToast("Start and End Keyframes cannot be the identical frame!");
      return;
    }
    if (startFrameIdx < 0 || startFrameIdx >= frames.length || endFrameIdx < 0 || endFrameIdx >= frames.length) {
      showToast("Invalid keyframe indices selected.");
      return;
    }
    if (startFrameIdx > endFrameIdx) {
      showToast("Start frame must be preceding or equal to the End frame index!");
      return;
    }

    try {
      setIsGenerating(true);
      const frameA = frames[startFrameIdx];
      const frameB = frames[endFrameIdx];

      // Load image data URLs into HTML images
      const imgA = await loadImage(frameA.image_data);
      const imgB = await loadImage(frameB.image_data);

      const generated: ProjectFrame[] = [];

      for (let i = 1; i <= numFramesToInsert; i++) {
        const p = i / (numFramesToInsert + 1);
        const t = applyEasing(p, easingType);

        // Canvas initialization
        const canvas = document.createElement("canvas");
        // Maintain dimensions of start frame
        canvas.width = frameA.width;
        canvas.height = frameA.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // 1. Draw Frame A with its transform values
        ctx.save();
        if (interpolateOpacity) {
          ctx.globalAlpha = 1 - t;
        } else {
          ctx.globalAlpha = 1.0;
        }

        // Apply transformations for Frame A
        const currentTransX = useTranslation ? translateX + (translateEndX - translateX) * t : 0;
        const currentTransY = useTranslation ? translateY + (translateEndY - translateY) * t : 0;
        const currentRot = useRotation ? startRotation + (endRotation - startRotation) * t : 0;
        const currentScale = useScale ? startScale + (endScale - startScale) * t : 1.0;

        ctx.translate(cx + currentTransX, cy + currentTransY);
        ctx.rotate((currentRot * Math.PI) / 180);
        ctx.scale(currentScale, currentScale);
        ctx.drawImage(imgA, -cx, -cy);
        ctx.restore();

        // 2. Draw Frame B with its transform values if cross-fading
        if (interpolateOpacity) {
          ctx.save();
          ctx.globalAlpha = t;

          ctx.translate(cx + currentTransX, cy + currentTransY);
          ctx.rotate((currentRot * Math.PI) / 180);
          ctx.scale(currentScale, currentScale);
          ctx.drawImage(imgB, -cx, -cy);
          ctx.restore();
        }

        // 3. Interpolate Hotspots
        const hotspotX = interpolateHotspot
          ? Math.round(frameA.hotspot_x + (frameB.hotspot_x - frameA.hotspot_x) * t)
          : frameA.hotspot_x;
        const hotspotY = interpolateHotspot
          ? Math.round(frameA.hotspot_y + (frameB.hotspot_y - frameA.hotspot_y) * t)
          : frameA.hotspot_y;

        // 4. Interpolate Durations
        const duration = interpolateDuration
          ? Math.round(frameA.duration_ms + (frameB.duration_ms - frameA.duration_ms) * t)
          : frameA.duration_ms;

        generated.push({
          frame_index: 0, // Will be reindexed
          duration_ms: duration,
          width: frameA.width,
          height: frameA.height,
          hotspot_x: hotspotX,
          hotspot_y: hotspotY,
          image_data: canvas.toDataURL("image/png"),
        });
      }

      // Slice timeline and splice in tween frames
      const part1 = frames.slice(0, startFrameIdx + 1);
      const part3 = frames.slice(endFrameIdx);
      const combined = [...part1, ...generated, ...part3];

      // Re-index all frames
      const reindexed = combined.map((f, index) => ({
        ...f,
        frame_index: index,
      }));

      onFramesUpdated(reindexed);
      showToast(`Successfully inserted ${numFramesToInsert} tween frames between keyframe ${startFrameIdx + 1} and ${endFrameIdx + 1}!`);
    } catch (err) {
      console.error(err);
      showToast("Auto-Tween compilation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div id="auto-tween-utility-panel" className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-[#F3EDE7]">
          <Sparkles className="w-4.5 h-4.5 text-[#E8793A] animate-pulse" />
          <h3 className="font-bold text-sm tracking-tight">Auto-Tween Motion Engine</h3>
        </div>
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="text-[#B8ADA3] hover:text-white transition-colors cursor-pointer"
          title="How to use Auto-Tween"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {showExplanation && (
        <div className="p-3 bg-[#E8793A]/5 border border-[#E8793A]/20 rounded-xl text-[11px] text-[#B8ADA3] leading-relaxed space-y-1.5 transition-all">
          <p className="font-bold text-[#F3EDE7] flex items-center gap-1">
            <span>💡</span> About Keyframe Tweening
          </p>
          <p>
            Select a <strong>Start Frame</strong> (Keyframe A) and an <strong>End Frame</strong> (Keyframe B). 
            Our rendering engine automatically generates intermediate frames between them, applying smooth mathematical transitions for translation, rotation, scale, and cross-fading!
          </p>
          <p>
            This replicates professional vector-animation suites to create fluid, continuous cursor movements inside Windows cursors.
          </p>
        </div>
      )}

      <div className="h-px bg-white/10 w-full"></div>

      {/* Selector Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#B8ADA3] uppercase tracking-wider block">Start Keyframe (A)</label>
          <select
            value={startFrameIdx}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setStartFrameIdx(val);
              if (val >= endFrameIdx) {
                setEndFrameIdx(Math.min(frames.length - 1, val + 1));
              }
            }}
            className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-[#F3EDE7] focus:border-[#E8793A] focus:outline-none cursor-pointer"
          >
            {frames.map((_, idx) => (
              <option key={idx} value={idx} className="bg-[#1C1512] text-white">
                Frame {idx + 1}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#B8ADA3] uppercase tracking-wider block">End Keyframe (B)</label>
          <select
            value={endFrameIdx}
            onChange={(e) => setEndFrameIdx(parseInt(e.target.value))}
            className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-[#F3EDE7] focus:border-[#E8793A] focus:outline-none cursor-pointer"
          >
            {frames.map((_, idx) => (
              <option key={idx} value={idx} disabled={idx <= startFrameIdx} className="bg-[#1C1512] disabled:opacity-30 text-white">
                Frame {idx + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Frame counts & Easing presets */}
      <div className="space-y-3 pt-1">
        <div className="flex justify-between items-center text-[10px] font-bold text-[#B8ADA3] uppercase tracking-wider">
          <span>Intermediate Frames</span>
          <span className="text-[#E8793A] font-mono font-bold text-xs">{numFramesToInsert} frames</span>
        </div>
        <input
          type="range"
          min="1"
          max="24"
          value={numFramesToInsert}
          onChange={(e) => setNumFramesToInsert(parseInt(e.target.value))}
          className="w-full h-1.5 rounded bg-neutral-900 accent-[#E8793A] cursor-pointer"
        />

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#B8ADA3] uppercase tracking-wider block">Transition Easing</label>
          <select
            value={easingType}
            onChange={(e) => setEasingType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-[#F3EDE7] focus:border-[#E8793A] focus:outline-none cursor-pointer"
          >
            {TWEEN_EASING_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.value} className="bg-[#1C1512]" title={preset.desc}>
                {preset.name}
              </option>
            ))}
          </select>
          <p className="text-[9px] text-[#B8ADA3] leading-tight italic">
            {TWEEN_EASING_PRESETS.find((p) => p.value === easingType)?.desc}
          </p>
        </div>
      </div>

      <div className="h-px bg-white/5 w-full"></div>

      {/* Property checkboxes */}
      <div className="space-y-3">
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Interpolated Properties</span>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label className="flex items-center space-x-2 p-2 rounded-lg bg-white/[0.01] hover:bg-white/[0.03] cursor-pointer border border-white/5 select-none">
            <input
              type="checkbox"
              checked={interpolateOpacity}
              onChange={(e) => setInterpolateOpacity(e.target.checked)}
              className="accent-[#E8793A]"
            />
            <span className="text-white text-[11px] font-semibold">Cross-Fade Opacity</span>
          </label>

          <label className="flex items-center space-x-2 p-2 rounded-lg bg-white/[0.01] hover:bg-white/[0.03] cursor-pointer border border-white/5 select-none">
            <input
              type="checkbox"
              checked={interpolateHotspot}
              onChange={(e) => setInterpolateHotspot(e.target.checked)}
              className="accent-[#E8793A]"
            />
            <span className="text-white text-[11px] font-semibold">Tween Hotspot</span>
          </label>

          <label className="flex items-center space-x-2 p-2 rounded-lg bg-white/[0.01] hover:bg-white/[0.03] cursor-pointer border border-white/5 select-none">
            <input
              type="checkbox"
              checked={interpolateDuration}
              onChange={(e) => setInterpolateDuration(e.target.checked)}
              className="accent-[#E8793A]"
            />
            <span className="text-white text-[11px] font-semibold">Tween Duration</span>
          </label>

          <label className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer border select-none transition-colors ${useTranslation ? "border-[#E8793A]/40 bg-[#E8793A]/5" : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03]"}`}>
            <input
              type="checkbox"
              checked={useTranslation}
              onChange={(e) => setUseTranslation(e.target.checked)}
              className="accent-[#E8793A]"
            />
            <span className="text-white text-[11px] font-semibold">Spatial Motion</span>
          </label>
        </div>
      </div>

      {/* Translation Offset Settings */}
      {useTranslation && (
        <div className="p-3 rounded-lg bg-black/40 border border-[#E8793A]/10 space-y-3.5 transition-all">
          <div className="flex items-center space-x-1 text-[10px] font-bold text-[#E8793A] uppercase tracking-wide">
            <Move className="w-3.5 h-3.5" />
            <span>Translation Offsets (X, Y in Pixels)</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-[9px] text-[#B8ADA3] font-mono">Start Offset X</label>
              <input
                type="number"
                value={translateX}
                onChange={(e) => setTranslateX(parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 rounded bg-black/60 border border-white/10 text-xs text-[#F3EDE7] font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-[#B8ADA3] font-mono">Start Offset Y</label>
              <input
                type="number"
                value={translateY}
                onChange={(e) => setTranslateY(parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 rounded bg-black/60 border border-white/10 text-xs text-[#F3EDE7] font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-[#B8ADA3] font-mono">End Offset X</label>
              <input
                type="number"
                value={translateEndX}
                onChange={(e) => setTranslateEndX(parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 rounded bg-black/60 border border-white/10 text-xs text-[#F3EDE7] font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-[#B8ADA3] font-mono">End Offset Y</label>
              <input
                type="number"
                value={translateEndY}
                onChange={(e) => setTranslateEndY(parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 rounded bg-black/60 border border-white/10 text-xs text-[#F3EDE7] font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Advanced Transform Properties */}
      <div className="space-y-3">
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Advanced Transforms</span>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer border select-none transition-colors ${useRotation ? "border-[#E8793A]/40 bg-[#E8793A]/5" : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03]"}`}>
            <input
              type="checkbox"
              checked={useRotation}
              onChange={(e) => setUseRotation(e.target.checked)}
              className="accent-[#E8793A]"
            />
            <span className="text-white text-[11px] font-semibold">Interpolate Rotation</span>
          </label>

          <label className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer border select-none transition-colors ${useScale ? "border-[#E8793A]/40 bg-[#E8793A]/5" : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03]"}`}>
            <input
              type="checkbox"
              checked={useScale}
              onChange={(e) => setUseScale(e.target.checked)}
              className="accent-[#E8793A]"
            />
            <span className="text-white text-[11px] font-semibold">Interpolate Scale</span>
          </label>
        </div>
      </div>

      {/* Rotation Settings */}
      {useRotation && (
        <div className="p-3 rounded-lg bg-black/40 border border-[#E8793A]/10 space-y-3 transition-all">
          <div className="flex items-center space-x-1 text-[10px] font-bold text-[#E8793A] uppercase tracking-wide">
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rotation Degrees</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-[9px] text-[#B8ADA3] font-mono">Start Angle (deg)</label>
              <input
                type="number"
                value={startRotation}
                onChange={(e) => setStartRotation(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 rounded bg-black/60 border border-white/10 text-xs text-[#F3EDE7] font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-[#B8ADA3] font-mono">End Angle (deg)</label>
              <input
                type="number"
                value={endRotation}
                onChange={(e) => setEndRotation(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 rounded bg-black/60 border border-white/10 text-xs text-[#F3EDE7] font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Scale Settings */}
      {useScale && (
        <div className="p-3 rounded-lg bg-black/40 border border-[#E8793A]/10 space-y-3 transition-all">
          <div className="flex items-center space-x-1 text-[10px] font-bold text-[#E8793A] uppercase tracking-wide">
            <ZoomIn className="w-3.5 h-3.5" />
            <span>Scale Factor</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-[9px] text-[#B8ADA3] font-mono">Start Scale (multiplier)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={startScale}
                onChange={(e) => setStartScale(parseFloat(e.target.value) || 1.0)}
                className="w-full px-2 py-1 rounded bg-black/60 border border-white/10 text-xs text-[#F3EDE7] font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-[#B8ADA3] font-mono">End Scale (multiplier)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={endScale}
                onChange={(e) => setEndScale(parseFloat(e.target.value) || 1.0)}
                className="w-full px-2 py-1 rounded bg-black/60 border border-white/10 text-xs text-[#F3EDE7] font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Generate Action Button */}
      <button
        onClick={handleGenerateTween}
        disabled={isGenerating || frames.length < 2 || startFrameIdx === endFrameIdx}
        className="w-full py-3 rounded-xl bg-[#E8793A] hover:bg-[#F2925C] disabled:opacity-40 disabled:pointer-events-none text-[#1C1512] text-xs font-bold transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[#E8793A]/10 cursor-pointer"
      >
        {isGenerating ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Rendering Smooth Transitions...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Generate Intermediate Frames</span>
          </>
        )}
      </button>
    </div>
  );
};
