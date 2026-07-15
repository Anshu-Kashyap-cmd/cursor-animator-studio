import React, { useState, useEffect, useRef } from "react";
import { 
  Smartphone, Eye, Download, Code, Sparkles, Plus, 
  HelpCircle, Laptop, Settings, Check, Zap, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProjectFrame } from "../types.ts";

interface MobileTouchSimulatorProps {
  activeFrame: ProjectFrame | null;
  onFrameUpdated: (frame: ProjectFrame) => void;
  showToast: (msg: string) => void;
}

interface TouchRipple {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

interface GestureParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export const MobileTouchSimulator: React.FC<MobileTouchSimulatorProps> = ({
  activeFrame,
  onFrameUpdated,
  showToast,
}) => {
  // Device mode: ios vs android
  const [devicePlatform, setDevicePlatform] = useState<"ios" | "android">("ios");
  // Wallpaper selection
  const [wallpaper, setWallpaper] = useState<string>("gradient-aurora");
  // Visual Touch Gesture Style
  const [gestureStyle, setGestureStyle] = useState<"neon-ripple" | "water-splash" | "sparkle-stars" | "hand-pointer">("neon-ripple");
  // Touch primary color
  const [touchColor, setTouchColor] = useState<string>("#38BDF8"); // light blue
  const [rippleSpeed, setRippleSpeed] = useState<number>(0.6); // seconds duration
  const [rippleMaxSize, setRippleMaxSize] = useState<number>(100); // pixels
  const [glowIntensity, setGlowIntensity] = useState<number>(10); // px shadow blur

  // Live simulation states
  const [ripples, setRipples] = useState<TouchRipple[]>([]);
  const [particles, setParticles] = useState<GestureParticle[]>([]);
  const [activeTouchPoint, setActiveTouchPoint] = useState<{ x: number; y: number } | null>(null);
  const [isPressing, setIsPressing] = useState<boolean>(false);
  const [pressure, setPressure] = useState<number>(1.0); // starts at 1.0, increases during hold up to 3.0
  
  const screenRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pressure hold loop
  useEffect(() => {
    let intervalId: any;
    if (isPressing) {
      setPressure(1.0);
      intervalId = setInterval(() => {
        setPressure((p) => Math.min(3.0, p + 0.06));
      }, 30);
    } else {
      // Trigger explosive shockwave ripple on high pressure release
      if (pressure > 1.5 && activeTouchPoint) {
        const { x, y } = activeTouchPoint;
        const finalPressureFactor = pressure;
        
        // Dynamic explosion ripples
        const superRipple: TouchRipple = {
          id: Date.now() + Math.random(),
          x,
          y,
          size: rippleMaxSize * finalPressureFactor * 0.7,
          color: touchColor,
        };
        setRipples((prev) => [...prev, superRipple]);
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== superRipple.id));
        }, rippleSpeed * 1200);

        // Particle explosion
        const expCount = Math.floor(12 * finalPressureFactor);
        const explosionParticles = Array.from({ length: expCount }).map((_, idx) => {
          const angle = (idx * Math.PI * 2) / expCount + (Math.random() - 0.5) * 0.5;
          const speed = (2 + Math.random() * 4) * finalPressureFactor;
          return {
            id: Date.now() + idx + Math.random(),
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: (3 + Math.random() * 4) * finalPressureFactor,
            alpha: 1.0,
            color: touchColor,
          };
        });
        setParticles((prev) => [...prev, ...explosionParticles]);
        showToast(`💥 Haptic Burst Triggered! Hold Force: ${Math.round(finalPressureFactor * 100)}%`);
      }
      setPressure(1.0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPressing]);

  // Particle physics loop for swipe trail
  useEffect(() => {
    let animationFrameId: number;
    const updateParticles = () => {
      setParticles((prevParticles) => 
        prevParticles
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            alpha: p.alpha - 0.03,
            size: Math.max(0, p.size * 0.95),
          }))
          .filter((p) => p.alpha > 0 && p.size > 0.5)
      );
      animationFrameId = requestAnimationFrame(updateParticles);
    };
    animationFrameId = requestAnimationFrame(updateParticles);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Screen click handler
  const handleScreenTouch = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!screenRef.current) return;
    const rect = screenRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setActiveTouchPoint({ x, y });
    setIsPressing(true);

    // Trigger initial Ripple
    const newRipple: TouchRipple = {
      id: Date.now() + Math.random(),
      x,
      y,
      size: 0,
      color: touchColor,
    };
    setRipples((prev) => [...prev, newRipple]);

    // Handle styles specific effects
    if (gestureStyle === "sparkle-stars") {
      const newParticles = Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * Math.PI * 2) / 12 + Math.random();
        const speed = 1.5 + Math.random() * 3;
        return {
          id: Date.now() + i + Math.random(),
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 4 + Math.random() * 4,
          alpha: 1.0,
          color: touchColor,
        };
      });
      setParticles((prev) => [...prev, ...newParticles]);
    } else if (gestureStyle === "water-splash") {
      const newParticles = Array.from({ length: 8 }).map((_, i) => {
        const angle = Math.PI + (i * Math.PI) / 8; // upward splash arc
        const speed = 2 + Math.random() * 4;
        return {
          id: Date.now() + i + Math.random(),
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed + 0.5, // gravity downward pull
          size: 5 + Math.random() * 5,
          alpha: 0.8,
          color: touchColor,
        };
      });
      setParticles((prev) => [...prev, ...newParticles]);
    }

    // Auto-clean old ripples
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, rippleSpeed * 1000);
  };

  const handleScreenRelease = () => {
    setIsPressing(false);
  };

  const handleScreenMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPressing || !screenRef.current) return;
    const rect = screenRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setActiveTouchPoint({ x, y });

    // Generate swipe trailing particles
    if (Math.random() > 0.4) {
      const p: GestureParticle = {
        id: Date.now() + Math.random(),
        x,
        y,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        size: gestureStyle === "sparkle-stars" ? 6 : 3,
        alpha: 0.9,
        color: touchColor,
      };
      setParticles((prev) => [...prev, p]);
    }
  };

  // --- BAKING TOUCH TEMPLATE GRAPHICS INTO CANVAS ---
  const handleBakeToActiveFrame = () => {
    if (!activeFrame) {
      showToast("First select/draw a custom cursor frame to inject touch indicator.");
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = activeFrame.width;
      canvas.height = activeFrame.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw original cursor graphic
      ctx.drawImage(img, 0, 0);

      const hx = activeFrame.hotspot_x;
      const hy = activeFrame.hotspot_y;

      // Draw custom gesture under/over the hotspot
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.shadowColor = touchColor;
      ctx.shadowBlur = glowIntensity;

      if (gestureStyle === "neon-ripple" || gestureStyle === "water-splash") {
        // Draw elegant glowing touch rings centered at hotspot
        ctx.strokeStyle = touchColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(hx, hy, 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = touchColor;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(hx, hy, 8, 0, Math.PI * 2);
        ctx.stroke();
      } else if (gestureStyle === "sparkle-stars") {
        // Draw elegant star particles around hotspot
        ctx.fillStyle = touchColor;
        const pts = [
          { dx: -5, dy: -5, s: 1.5 },
          { dx: 6, dy: -4, s: 2.0 },
          { dx: -4, dy: 6, s: 1.2 },
          { dx: 5, dy: 5, s: 1.8 }
        ];
        pts.forEach((pt) => {
          ctx.beginPath();
          ctx.arc(hx + pt.dx, hy + pt.dy, pt.s, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (gestureStyle === "hand-pointer") {
        // Render a miniature elegant translucent glass-like hand print dot
        ctx.fillStyle = touchColor;
        ctx.beginPath();
        ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(hx, hy, 5.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      onFrameUpdated({
        ...activeFrame,
        image_data: canvas.toDataURL("image/png")
      });
      showToast("Successfully baked interactive hand touch cue into frame!");
    };
    img.src = activeFrame.image_data;
  };

  // --- EXPORT WEB TOUCH INTERACTION CLASS SNIPPET ---
  const handleCopyWebWidgetCode = () => {
    const codeSnippet = `<script>
// ===================================================
// Mobile Hand Touch Screen Ripple Gesture Widget
// Generated via Cursor Animator Studio 
// ===================================================
(function() {
  const css = \`
    .touch-indicator-ripple {
      position: absolute;
      border-radius: 50%;
      background: transparent;
      border: 2px solid ${touchColor};
      box-shadow: 0 0 ${glowIntensity}px ${touchColor};
      pointer-events: none;
      transform: translate(-50%, -50%);
      animation: touchIndicatorExpand ${rippleSpeed}s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
      z-index: 99999;
    }
    @keyframes touchIndicatorExpand {
      0% { width: 0; height: 0; opacity: 1; }
      100% { width: ${rippleMaxSize}px; height: ${rippleMaxSize}px; opacity: 0; }
    }
  \`;
  const style = document.createElement("style");
  style.innerHTML = css;
  document.head.appendChild(style);

  window.addEventListener("pointerdown", function(e) {
    const ripple = document.createElement("div");
    ripple.className = "touch-indicator-ripple";
    ripple.style.left = e.pageX + "px";
    ripple.style.top = e.pageY + "px";
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), ${rippleSpeed * 1000});
  });
})();
</script>`;

    navigator.clipboard.writeText(codeSnippet);
    showToast("📋 Web Widget script copied! Add this inside your HTML body.");
  };

  return (
    <div className="rounded-[20px] bg-white/[0.03] border border-white/10 p-5 space-y-5 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Glow Effect background */}
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Smartphone className="w-4.5 h-4.5 text-sky-400" />
          <span>Mobile Touch Simulator</span>
        </h3>
        <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">Mobile UI</span>
      </div>

      <p className="text-[10px] text-[#B8ADA3] leading-snug">
        Test high-quality tap & swipe gesture cues for iOS/Android smartphones. Preview, bake overlays, or copy code for mobile apps.
      </p>

      {/* Device Arena & Layout Column */}
      <div className="space-y-4">
        
        {/* Visual Device Simulator Stage */}
        <div className="flex flex-col items-center">
          <div 
            className={`relative rounded-[36px] bg-neutral-900 border-[7px] border-neutral-800 shadow-2xl overflow-hidden transition-all duration-300 select-none ${
              devicePlatform === "ios" ? "h-64 w-36" : "h-64 w-36"
            }`}
          >
            {/* iOS Dynamic Island Notch */}
            {devicePlatform === "ios" ? (
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-14 h-4 bg-black rounded-full z-30 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-900/40 ml-auto mr-1"></div>
              </div>
            ) : (
              // Android Camera Punch-hole
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-black rounded-full z-30"></div>
            )}

            {/* Simulated Mobile Status bar */}
            <div className="absolute top-1 left-0 right-0 px-3 flex justify-between text-[7px] text-white/80 font-bold font-sans z-20 pointer-events-none">
              <span>9:41</span>
              <div className="flex gap-1 items-center">
                <span>5G</span>
                <div className="w-3 h-1.5 border border-white/80 rounded-sm p-[1px] flex items-center">
                  <div className="bg-white h-full w-[80%]"></div>
                </div>
              </div>
            </div>

            {/* Screen Wallpaper Content */}
            <div 
              ref={screenRef}
              onMouseDown={handleScreenTouch}
              onMouseUp={handleScreenRelease}
              onMouseMove={handleScreenMove}
              className={`absolute inset-0 z-10 transition-all cursor-pointer flex flex-col justify-end p-3 overflow-hidden ${
                wallpaper === "gradient-aurora" ? "bg-gradient-to-tr from-indigo-900 via-purple-900 to-pink-900" :
                wallpaper === "cyberpunk" ? "bg-gradient-to-br from-neutral-950 via-[#1C112C] to-neutral-950" :
                "bg-gradient-to-b from-sky-900 to-indigo-950"
              }`}
            >
              {/* Wallpaper Grid subtle lines */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none"></div>

              {/* Dynamic Real-time Haptic & Force Meter HUD */}
              <div className="absolute top-8 left-2 right-2 bg-black/70 backdrop-blur-md rounded-lg border border-white/10 p-1.5 flex items-center justify-between text-[7px] text-white/80 font-mono z-20 pointer-events-none shadow-lg">
                <div className="flex items-center gap-1">
                  <Zap className={`w-2.5 h-2.5 ${pressure > 1.8 ? "text-amber-400 animate-pulse" : "text-sky-400"}`} />
                  <span>FORCE: <span className="text-white font-bold">{Math.round(pressure * 100)}%</span></span>
                </div>
                <div className="flex-1 max-w-[45px] h-1.5 bg-neutral-800 rounded-full overflow-hidden mx-1 border border-white/5">
                  <div 
                    className="h-full transition-all duration-75"
                    style={{
                      width: `${((pressure - 1) / 2) * 100}%`,
                      backgroundColor: pressure > 2.2 ? "#F43F5E" : pressure > 1.5 ? "#F59E0B" : "#38BDF8",
                      boxShadow: `0 0 6px ${touchColor}`
                    }}
                  />
                </div>
                <span>{pressure > 2.2 ? "3D TOUCH" : pressure > 1.5 ? "MEDIUM" : "LIGHT"}</span>
              </div>

              {/* Tap to test visual text */}
              <div className="absolute top-16 left-0 right-0 text-center pointer-events-none space-y-0.5">
                <p className="text-[8px] text-white/40 font-bold tracking-wider uppercase">Haptic Simulator</p>
                <p className="text-[7.5px] text-sky-400/90 animate-pulse font-medium">Hold down to charge force trigger</p>
              </div>

              {/* iOS home indicator bar */}
              <div className="w-12 h-1 bg-white/40 mx-auto rounded-full mt-1.5 z-20 pointer-events-none"></div>

              {/* LIVE PRESSURE INDICATOR RING */}
              {isPressing && activeTouchPoint && (
                <div
                  className="absolute rounded-full pointer-events-none flex items-center justify-center -translate-x-1/2 -translate-y-1/2 z-30"
                  style={{
                    left: activeTouchPoint.x,
                    top: activeTouchPoint.y,
                    width: 32 * pressure,
                    height: 32 * pressure,
                    border: `2px dashed ${touchColor}`,
                    backgroundColor: `${touchColor}15`,
                    boxShadow: `0 0 ${glowIntensity * pressure}px ${touchColor}`,
                    transition: "width 0.05s ease-out, height 0.05s ease-out"
                  }}
                >
                  {/* Dynamic core */}
                  <div 
                    className="rounded-full transition-all duration-75"
                    style={{
                      width: 10 + 6 * pressure,
                      height: 10 + 6 * pressure,
                      backgroundColor: touchColor,
                      boxShadow: `0 0 ${glowIntensity * 1.5}px ${touchColor}`,
                    }}
                  />
                </div>
              )}

              {/* RENDER ACTIVE TOUCH RIPPLES (Live Canvas/SVG Effects) */}
              <AnimatePresence>
                {ripples.map((ripple) => (
                  <motion.div
                    key={ripple.id}
                    className="absolute rounded-full pointer-events-none flex items-center justify-center"
                    style={{
                      left: ripple.x,
                      top: ripple.y,
                    }}
                    initial={{ width: 0, height: 0, opacity: 1, scale: 0 }}
                    animate={{ 
                      width: rippleMaxSize * 0.6, 
                      height: rippleMaxSize * 0.6, 
                      opacity: 0,
                      scale: 1 
                    }}
                    transition={{ duration: rippleSpeed, ease: "easeOut" }}
                  >
                    {/* Ring Outer */}
                    <div 
                      className="absolute inset-0 rounded-full border-2"
                      style={{ 
                        borderColor: ripple.color, 
                        boxShadow: `0 0 ${glowIntensity}px ${ripple.color}`
                      }}
                    />
                    {/* Secondary inner ring */}
                    {gestureStyle === "water-splash" && (
                      <motion.div 
                        className="absolute inset-2 rounded-full border border-dashed"
                        style={{ borderColor: ripple.color }}
                        initial={{ scale: 0.2 }}
                        animate={{ scale: 0.9 }}
                        transition={{ duration: rippleSpeed }}
                      />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Render trailing touch particles */}
              {particles.map((p) => (
                <div
                  key={p.id}
                  className="absolute rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: p.x,
                    top: p.y,
                    width: p.size,
                    height: p.size,
                    opacity: p.alpha,
                    backgroundColor: p.color,
                    boxShadow: `0 0 4px ${p.color}`,
                    transition: "transform 0.1s linear"
                  }}
                />
              ))}

              {/* Realistic Hand pointer simulation overlay */}
              {gestureStyle === "hand-pointer" && activeTouchPoint && isPressing && (
                <div 
                  className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75 flex flex-col items-center z-40"
                  style={{
                    left: activeTouchPoint.x + 10,
                    top: activeTouchPoint.y + 12
                  }}
                >
                  {/* Miniature translucent circle for touch point and shadow hand outline */}
                  <div className="w-5 h-5 rounded-full bg-white/20 border border-white/40 flex items-center justify-center shadow-lg backdrop-blur-xs">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-400"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Toggle buttons below phone */}
          <div className="flex gap-2.5 mt-3">
            <button
              onClick={() => setDevicePlatform("ios")}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                devicePlatform === "ios" 
                  ? "bg-sky-400/20 text-sky-400 border border-sky-400/30" 
                  : "bg-neutral-900 text-neutral-400 border border-transparent"
              }`}
            >
              iOS Phone
            </button>
            <button
              onClick={() => setDevicePlatform("android")}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                devicePlatform === "android" 
                  ? "bg-sky-400/20 text-sky-400 border border-sky-400/30" 
                  : "bg-neutral-900 text-neutral-400 border border-transparent"
              }`}
            >
              Android Phone
            </button>
          </div>
        </div>

        {/* Configuration sliders & options */}
        <div className="space-y-3.5 bg-black/25 p-3.5 rounded-xl border border-white/5">
          {/* Visual Style Selection */}
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold text-neutral-500 block">Gesture Visual Style</span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "neon-ripple", label: "Neon Ring" },
                { id: "water-splash", label: "Water Splash" },
                { id: "sparkle-stars", label: "Sparkle Stars" },
                { id: "hand-pointer", label: "Hand Touch" }
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setGestureStyle(style.id as any)}
                  className={`py-1.5 px-2 rounded-lg text-[9px] font-semibold text-center border cursor-pointer transition-all ${
                    gestureStyle === style.id
                      ? "bg-sky-400/10 text-sky-400 border-sky-400/40"
                      : "bg-neutral-900/50 text-neutral-400 border-transparent hover:bg-neutral-800"
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[9px] uppercase font-bold text-neutral-500">Touch Glow Color</span>
              <span className="text-[9px] font-mono text-white/70">{touchColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={touchColor}
                onChange={(e) => setTouchColor(e.target.value)}
                className="w-7 h-7 rounded bg-transparent border-0 cursor-pointer"
              />
              <div className="flex-1 grid grid-cols-4 gap-1">
                {["#38BDF8", "#F43F5E", "#22C55E", "#F59E0B"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setTouchColor(c)}
                    className="h-4 rounded border border-white/10"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Ripple Max Size slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[9px]">
              <span className="font-bold text-neutral-400">Touch Ripple Diameter</span>
              <span className="text-white font-bold">{rippleMaxSize}px</span>
            </div>
            <input
              type="range"
              min="50"
              max="160"
              value={rippleMaxSize}
              onChange={(e) => setRippleMaxSize(parseInt(e.target.value))}
              className="w-full h-1 bg-neutral-900 rounded-lg accent-sky-400 cursor-pointer"
            />
          </div>

          {/* Ripple speed duration */}
          <div className="space-y-1">
            <div className="flex justify-between text-[9px]">
              <span className="font-bold text-neutral-400">Expand Speed (Duration)</span>
              <span className="text-white font-bold">{rippleSpeed}s</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="1.5"
              step="0.1"
              value={rippleSpeed}
              onChange={(e) => setRippleSpeed(parseFloat(e.target.value))}
              className="w-full h-1 bg-neutral-900 rounded-lg accent-sky-400 cursor-pointer"
            />
          </div>

          {/* Background switcher */}
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold text-neutral-500 block">Phone Wallpaper</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setWallpaper("gradient-aurora")}
                className={`flex-1 py-1 rounded text-[8px] font-bold ${
                  wallpaper === "gradient-aurora" ? "bg-white/20 text-white" : "bg-neutral-900 text-neutral-400"
                }`}
              >
                Aurora
              </button>
              <button
                onClick={() => setWallpaper("cyberpunk")}
                className={`flex-1 py-1 rounded text-[8px] font-bold ${
                  wallpaper === "cyberpunk" ? "bg-white/20 text-white" : "bg-neutral-900 text-neutral-400"
                }`}
              >
                Deep Grid
              </button>
            </div>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleBakeToActiveFrame}
            disabled={!activeFrame}
            className="py-2.5 px-3 bg-sky-400 hover:bg-sky-500 disabled:opacity-40 text-neutral-900 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-sky-400/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Bake into Cursor</span>
          </button>
          
          <button
            onClick={handleCopyWebWidgetCode}
            className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-[#F3EDE7] rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/5"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Web Widget Code</span>
          </button>
        </div>
      </div>
    </div>
  );
};
