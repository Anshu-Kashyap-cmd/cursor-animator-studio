import React, { useState, useEffect, useRef } from "react";
import { Sliders, Activity, Sparkles, HelpCircle, RefreshCw, MoveHorizontal, Play, Pause } from "lucide-react";
import { EasingType, applyEasing } from "../engine/effects/easing.ts";

interface EasingEditorProps {
  selectedEasing: EasingType;
  onEasingSelected: (easing: EasingType) => void;
}

interface EasingPreset {
  id: string;
  name: string;
  type: "bezier" | "physics" | "math";
  value: string;
  description: string;
}

const EASING_PRESETS: EasingPreset[] = [
  { id: "linear", name: "Linear", type: "bezier", value: "linear", description: "Constant speed, no acceleration" },
  { id: "ease-in", name: "Ease-In", type: "bezier", value: "ease-in", description: "Slow start, accelerates toward end" },
  { id: "ease-out", name: "Ease-Out", type: "bezier", value: "ease-out", description: "Fast start, decelerates toward end" },
  { id: "ease-in-out", name: "Ease-In-Out", type: "bezier", value: "ease-in-out", description: "Symmetric slow-fast-slow sequence" },
  { id: "ease-in-back", name: "Anticipation (In-Back)", type: "bezier", value: "cubic-bezier(0.36, 0, 0.66, -0.56)", description: "Slight pullback before accelerating forward" },
  { id: "ease-out-back", name: "Overshoot (Out-Back)", type: "bezier", value: "cubic-bezier(0.34, 1.56, 0.64, 1)", description: "Flies past destination, then bounces gently back" },
  { id: "ease-in-out-back", name: "Wind-up & Bounce", type: "bezier", value: "cubic-bezier(0.68, -0.6, 0.32, 1.6)", description: "Pullback start combined with overshoot landing" },
  { id: "elastic-out", name: "Elastic Bounce", type: "physics", value: "elastic-out", description: "Decelerating spring oscillation physics" },
  { id: "bounce-out", name: "Gravity Bounce", type: "physics", value: "bounce-out", description: "Simulates multiple hard elastic floor collisions" },
];

export const EasingEditor: React.FC<EasingEditorProps> = ({
  selectedEasing,
  onEasingSelected,
}) => {
  // Parsing helpers
  const getCubicBezierCoords = (val: string): [number, number, number, number] => {
    const trimmed = val.trim().toLowerCase();
    if (trimmed.startsWith("cubic-bezier(")) {
      const parts = trimmed
        .replace("cubic-bezier(", "")
        .replace(")", "")
        .split(",")
        .map((n) => parseFloat(n.trim()));
      if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
        return [parts[0], parts[1], parts[2], parts[3]];
      }
    }
    // Map traditional presets
    if (trimmed === "ease-in") return [0.42, 0.0, 1.0, 1.0];
    if (trimmed === "ease-out") return [0.0, 0.0, 0.58, 1.0];
    if (trimmed === "ease-in-out") return [0.42, 0.0, 0.58, 1.0];
    return [0.25, 0.25, 0.75, 0.75]; // Linear or default fallback
  };

  const isCubicBezier = (val: string): boolean => {
    const trimmed = val.trim().toLowerCase();
    return (
      trimmed.startsWith("cubic-bezier(") ||
      ["linear", "ease-in", "ease-out", "ease-in-out", "ease-in-back", "ease-out-back", "ease-in-out-back"].includes(trimmed)
    );
  };

  const [coords, setCoords] = useState<[number, number, number, number]>(() => getCubicBezierCoords(selectedEasing));
  const [playSimulation, setPlaySimulation] = useState(true);
  const [simTime, setSimTime] = useState(0);

  // Sync state if parent selectedEasing changes
  useEffect(() => {
    if (isCubicBezier(selectedEasing)) {
      setCoords(getCubicBezierCoords(selectedEasing));
    }
  }, [selectedEasing]);

  // Handle local cubic-bezier slider changes
  const handleSliderChange = (index: number, val: number) => {
    const newCoords = [...coords] as [number, number, number, number];
    newCoords[index] = val;
    setCoords(newCoords);
    const bezierString = `cubic-bezier(${newCoords[0].toFixed(2)}, ${newCoords[1].toFixed(2)}, ${newCoords[2].toFixed(2)}, ${newCoords[3].toFixed(2)})`;
    onEasingSelected(bezierString);
  };

  // Run physics simulator timer
  useEffect(() => {
    if (!playSimulation) return;
    
    let lastTime = performance.now();
    let frameId: number;

    const tick = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      
      setSimTime((prev) => {
        const next = prev + delta * 0.6; // Speed coefficient
        return next > 1 ? 0 : next; // Loop back
      });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [playSimulation]);

  // Render SVG Graph coordinates
  const svgWidth = 180;
  const svgHeight = 180;
  const padding = 25;
  const graphWidth = svgWidth - padding * 2;
  const graphHeight = svgHeight - padding * 2;

  // Convert normalized (0-1) coordinates to SVG pixel space
  const toSvgX = (x: number) => padding + x * graphWidth;
  const toSvgY = (y: number) => {
    // Easing curves can overshoot y = 1 or drop below y = 0. We stretch the graph grid:
    // y = 0 corresponds to bottom border (y = 130), y = 1 corresponds to top border (y = 50)
    // Scale factor: graphHeight is 130 pixels. Let's map 0..1 to 0..100% of graphHeight.
    return padding + graphHeight - y * graphHeight;
  };

  // Generate SVG path for the active easing curve
  const generatePathD = () => {
    const segments = 40;
    const points: string[] = [];
    for (let i = 0; i <= segments; i++) {
      const x = i / segments;
      const y = applyEasing(x, selectedEasing);
      points.push(`${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`);
    }
    return `M ${points.join(" L ")}`;
  };

  const curvePathD = generatePathD();

  // Active indicator position
  const activeX = simTime;
  const activeY = applyEasing(simTime, selectedEasing);
  const activePointX = toSvgX(activeX);
  const activePointY = toSvgY(activeY);

  // Control points for bezier handles
  const isCubic = isCubicBezier(selectedEasing);
  const [x1, y1, x2, y2] = coords;

  return (
    <div className="flex flex-col space-y-4 p-5 rounded-2xl bg-white/[0.02] border border-white/10 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-[#F3EDE7]">
          <Sliders className="w-4.5 h-4.5 text-[#E8793A]" />
          <h3 className="font-bold text-sm tracking-tight">Interactive Easing Editor</h3>
        </div>
        <button
          onClick={() => {
            onEasingSelected("linear");
            setCoords([0.25, 0.25, 0.75, 0.75]);
          }}
          className="text-[10px] font-mono text-[#B8ADA3] hover:text-[#E8793A] transition-colors cursor-pointer flex items-center space-x-1"
          title="Reset to linear"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      <div className="h-px bg-white/10 w-full"></div>

      {/* Preset curves grid */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-[#B8ADA3] uppercase tracking-wider block">Animation Curve Presets</span>
        <div className="grid grid-cols-3 gap-2">
          {EASING_PRESETS.map((preset) => {
            const isSelected = selectedEasing === preset.value || 
              (preset.id === "ease-in-back" && selectedEasing.includes("0.36")) ||
              (preset.id === "ease-out-back" && selectedEasing.includes("1.56")) ||
              (preset.id === "ease-in-out-back" && selectedEasing.includes("-0.6"));

            return (
              <button
                key={preset.id}
                onClick={() => {
                  onEasingSelected(preset.value);
                  if (isCubicBezier(preset.value)) {
                    setCoords(getCubicBezierCoords(preset.value));
                  }
                }}
                className={`py-2 px-1 rounded-lg border text-center transition-all cursor-pointer flex flex-col justify-center min-h-[50px] ${
                  isSelected
                    ? "border-[#E8793A] bg-[#E8793A]/10 text-white shadow-[0_0_8px_rgba(232,121,58,0.15)]"
                    : "border-white/5 bg-black/20 text-[#B8ADA3] hover:bg-black/30 hover:text-white"
                }`}
                title={preset.description}
              >
                <span className="font-bold text-[10px] block truncate px-1">{preset.name}</span>
                <span className="text-[8px] text-neutral-500 font-medium block capitalize mt-0.5">{preset.type}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dual Column Layout: SVG Graph Plotter vs Custom Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Left Column: Visual Curve Plotter Grid */}
        <div className="flex flex-col items-center justify-center bg-black/40 p-3 rounded-xl border border-white/5 relative">
          <svg width={svgWidth} height={svgHeight} className="overflow-visible">
            {/* Grid Helper Lines */}
            <rect x={padding} y={padding} width={graphWidth} height={graphHeight} fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.04" />
            <line x1={padding} y1={toSvgY(0.5)} x2={padding + graphWidth} y2={toSvgY(0.5)} stroke="white" strokeDasharray="3 3" strokeOpacity="0.1" />
            <line x1={toSvgX(0.5)} y1={padding} x2={toSvgX(0.5)} y2={padding + graphHeight} stroke="white" strokeDasharray="3 3" strokeOpacity="0.1" />
            
            {/* Standard Diagonal Linear Line */}
            <line x1={toSvgX(0)} y1={toSvgY(0)} x2={toSvgX(1)} y2={toSvgY(1)} stroke="white" strokeDasharray="2 2" strokeOpacity="0.15" />

            {/* Bezier control handles if editable cubic-bezier */}
            {isCubic && (
              <>
                {/* Handle 1 */}
                <line x1={toSvgX(0)} y1={toSvgY(0)} x2={toSvgX(x1)} y2={toSvgY(y1)} stroke="#E8793A" strokeWidth="1.5" strokeOpacity="0.5" />
                <circle cx={toSvgX(x1)} cy={toSvgY(y1)} r="4" fill="#E8793A" className="shadow-lg" />
                
                {/* Handle 2 */}
                <line x1={toSvgX(1)} y1={toSvgY(1)} x2={toSvgX(x2)} y2={toSvgY(y2)} stroke="#6E5A7B" strokeWidth="1.5" strokeOpacity="0.5" />
                <circle cx={toSvgX(x2)} cy={toSvgY(y2)} r="4" fill="#6E5A7B" className="shadow-lg" />
              </>
            )}

            {/* Rendered Curve Path */}
            <path d={curvePathD} fill="none" stroke="url(#gradient-curve)" strokeWidth="3" strokeLinecap="round" />

            {/* Dynamic sweeping tracer dot */}
            {playSimulation && (
              <circle cx={activePointX} cy={activePointY} r="5" fill="#E8793A" className="animate-pulse shadow-md" />
            )}

            {/* Text labels */}
            <text x={padding - 5} y={padding + graphHeight + 4} fill="#B8ADA3" fontSize="8" fontFamily="monospace" textAnchor="end">0</text>
            <text x={padding - 5} y={padding + 4} fill="#B8ADA3" fontSize="8" fontFamily="monospace" textAnchor="end">1</text>
            <text x={padding} y={padding + graphHeight + 15} fill="#B8ADA3" fontSize="8" fontFamily="monospace">Start</text>
            <text x={padding + graphWidth} y={padding + graphHeight + 15} fill="#B8ADA3" fontSize="8" fontFamily="monospace" textAnchor="end">End</text>

            {/* Defs Gradient */}
            <defs>
              <linearGradient id="gradient-curve" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E8793A" />
                <stop offset="100%" stopColor="#6E5A7B" />
              </linearGradient>
            </defs>
          </svg>

          {/* Tracer toggle control */}
          <button
            onClick={() => setPlaySimulation(!playSimulation)}
            className="absolute bottom-2 right-2 p-1 rounded bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title={playSimulation ? "Pause curve tracing" : "Resume curve tracing"}
          >
            {playSimulation ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Right Column: Dynamic Sliders and Coordinate values */}
        <div className="space-y-3.5">
          {isCubic ? (
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Custom Bezier Tuning</span>
              
              {/* Slider P1 X */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                  <span>P1.x (Start Speed)</span>
                  <span className="text-[#E8793A] font-bold">{x1.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={x1}
                  onChange={(e) => handleSliderChange(0, parseFloat(e.target.value))}
                  className="w-full accent-[#E8793A] h-1 rounded bg-neutral-900"
                />
              </div>

              {/* Slider P1 Y */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                  <span>P1.y (Anticipation)</span>
                  <span className="text-[#E8793A] font-bold">{y1.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-1.5"
                  max="2.5"
                  step="0.01"
                  value={y1}
                  onChange={(e) => handleSliderChange(1, parseFloat(e.target.value))}
                  className="w-full accent-[#E8793A] h-1 rounded bg-neutral-900"
                />
              </div>

              {/* Slider P2 X */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                  <span>P2.x (End Speed)</span>
                  <span className="text-[#6E5A7B] font-bold">{x2.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={x2}
                  onChange={(e) => handleSliderChange(2, parseFloat(e.target.value))}
                  className="w-full accent-[#6E5A7B] h-1 rounded bg-neutral-900"
                />
              </div>

              {/* Slider P2 Y */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
                  <span>P2.y (Overshoot)</span>
                  <span className="text-[#6E5A7B] font-bold">{y2.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-1.5"
                  max="2.5"
                  step="0.01"
                  value={y2}
                  onChange={(e) => handleSliderChange(3, parseFloat(e.target.value))}
                  className="w-full accent-[#6E5A7B] h-1 rounded bg-neutral-900"
                />
              </div>
            </div>
          ) : (
            <div className="bg-neutral-950/45 p-4 rounded-xl border border-white/5 space-y-2 h-full flex flex-col justify-center">
              <span className="text-[10px] font-bold text-[#E8793A] uppercase tracking-wider block">Physics Curve Active</span>
              <p className="text-[11px] text-[#B8ADA3] leading-relaxed">
                You have active spring/bounce equations loaded. This dynamic physics motion utilizes multi-bounce momentum and elastic decay that cannot be modeled by simple cubic-beziers.
              </p>
              <div className="p-2 bg-[#E8793A]/5 border border-[#E8793A]/20 rounded-lg text-[9px] text-[#E8793A] font-semibold text-center uppercase tracking-wide">
                Procedural Physics Math Active
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Physics Simulation Area (Live Motion Simulation) */}
      <div className="bg-black/40 p-3.5 rounded-xl border border-white/5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-neutral-400">
            <MoveHorizontal className="w-3.5 h-3.5 text-[#E8793A]" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Live Physics Loop Simulator</span>
          </div>
          <span className="font-mono text-[9px] text-neutral-500">Progress: {Math.round(simTime * 100)}%</span>
        </div>

        {/* Horizontal corridor lane */}
        <div className="h-10 rounded-lg bg-neutral-950/80 border border-white/5 relative flex items-center overflow-hidden">
          {/* Timeline background dashes */}
          <div className="absolute inset-x-4 inset-y-0 flex justify-between pointer-events-none opacity-20">
            {[...Array(11)].map((_, i) => (
              <div key={i} className="w-px bg-white h-full" />
            ))}
          </div>

          {/* Sliding Cursor Node */}
          <div
            className="absolute left-4 w-6 h-6 rounded-md bg-[#E8793A] flex items-center justify-center shadow-lg shadow-[#E8793A]/20 transition-transform duration-75"
            style={{
              transform: `translateX(${applyEasing(simTime, selectedEasing) * (svgWidth - 28)}px)`,
            }}
          >
            {/* Drawing a miniature mouse pointer */}
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-black fill-current stroke-[2]">
              <path d="M5.5 2v17l4.5-4.5 3.5 6 3-1.5-3.5-6H20z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Auto-bind status info */}
      <div className="p-3 rounded-lg bg-[#E8793A]/5 border border-[#E8793A]/10 flex items-start space-x-2">
        <div className="bg-[#E8793A]/10 p-1 rounded text-[#E8793A]">
          <Activity className="w-3.5 h-3.5" />
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-white block">Applied to Procedural Effects</span>
          <p className="text-[9px] text-[#B8ADA3] leading-normal">
            This easing curve determines the rotational, scaling, translation, and orbital speeds of all auto-animated frames!
          </p>
        </div>
      </div>
    </div>
  );
};
