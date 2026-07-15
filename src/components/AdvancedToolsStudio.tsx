import React, { useState, useEffect, useRef } from "react";
import { 
  RotateCw, RotateCcw, Target, Sparkles, Sliders, Layers, 
  Download, Upload, Play, Pause, Trash2, Zap, Check, ArrowRight, Grid, MousePointer, ShieldAlert
} from "lucide-react";
import { ProjectFrame, ProjectData } from "../types.ts";
import { writeCurFile } from "../engine/curWriter.ts";
import { writeAniFile } from "../engine/aniWriter.ts";
import JSZip from "jszip";

interface AdvancedToolsStudioProps {
  project: ProjectData;
  activeFrame: ProjectFrame | null;
  onFrameUpdated: (frame: ProjectFrame) => void;
  onFramesUpdated: (frames: ProjectFrame[]) => void;
  showToast: (msg: string) => void;
  selectedColor: string;
}

interface SchemeSlot {
  key: string;
  label: string;
  fileName: string;
  registryKey: string;
  isAnimated: boolean;
  frames: { pngDataUrl: string; durationMs: number; hotspotX: number; hotspotY: number }[] | null;
}

export const AdvancedToolsStudio: React.FC<AdvancedToolsStudioProps> = ({
  project,
  activeFrame,
  onFrameUpdated,
  onFramesUpdated,
  showToast,
  selectedColor
}) => {
  const [activeTab, setActiveTab] = useState<"rotation" | "hotspot" | "pipeline" | "scheme">("rotation");

  // --- FEATURE 1: AUTO-ROTATION CONFIG ---
  const [rotationDir, setRotationDir] = useState<"cw" | "ccw">("cw");
  const [rotationFrameCount, setRotationFrameCount] = useState<number>(24);
  const [rotationSpeed, setRotationSpeed] = useState<number>(80); // ms per frame
  const [rotationBaseImage, setRotationBaseImage] = useState<string | null>(null);
  const rotationUploadRef = useRef<HTMLInputElement>(null);

  // --- FEATURE 2: HOTSPOT ZOOM SELECTOR & SANDBOX ---
  const [zoomLevel, setZoomLevel] = useState<number>(10); // multiplier
  const [sandboxHits, setSandboxHits] = useState<number>(0);
  const [sandboxTarget, setSandboxTarget] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [sandboxFloatingParticles, setSandboxFloatingParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const sandboxRef = useRef<HTMLDivElement>(null);

  // --- FEATURE 3: DYNAMIC VISUAL EFFECT PIPELINE ---
  const [glowColor, setGlowColor] = useState<string>("#FF0055");
  const [glowBlur, setGlowBlur] = useState<number>(4);
  const [shadowColor, setShadowColor] = useState<string>("rgba(0,0,0,0.6)");
  const [shadowBlur, setShadowBlur] = useState<number>(3);
  const [shadowOffsetX, setShadowOffsetX] = useState<number>(2);
  const [shadowOffsetY, setShadowOffsetY] = useState<number>(2);
  const [rainbowShiftEnabled, setRainbowShiftEnabled] = useState<boolean>(false);
  const [rainbowCycles, setRainbowCycles] = useState<number>(1);

  // --- FEATURE 4: MULTI-CURSOR SCHEME MAPPER ---
  const [schemeName, setSchemeName] = useState<string>("Ninja Clan Custom");
  const [schemeSlots, setSchemeSlots] = useState<SchemeSlot[]>([
    { key: "Arrow", label: "Normal Select", fileName: "normal.cur", registryKey: "Arrow", isAnimated: false, frames: null },
    { key: "Help", label: "Help Select", fileName: "help.cur", registryKey: "Help", isAnimated: false, frames: null },
    { key: "AppStarting", label: "Working in Background", fileName: "working.ani", registryKey: "AppStarting", isAnimated: true, frames: null },
    { key: "Wait", label: "Busy", fileName: "busy.ani", registryKey: "Wait", isAnimated: true, frames: null },
    { key: "Crosshair", label: "Precision Select", fileName: "precision.cur", registryKey: "Crosshair", isAnimated: false, frames: null },
    { key: "IBeam", label: "Text Select", fileName: "text.cur", registryKey: "IBeam", isAnimated: false, frames: null },
    { key: "NWPen", label: "Handwriting", fileName: "handwriting.cur", registryKey: "NWPen", isAnimated: false, frames: null },
    { key: "No", label: "Unavailable", fileName: "unavailable.cur", registryKey: "No", isAnimated: false, frames: null },
    { key: "SizeNS", label: "Vertical Resize", fileName: "vertical.cur", registryKey: "SizeNS", isAnimated: false, frames: null },
    { key: "SizeWE", label: "Horizontal Resize", fileName: "horizontal.cur", registryKey: "SizeWE", isAnimated: false, frames: null },
    { key: "SizeNWSE", label: "Diagonal Resize 1", fileName: "diagonal1.cur", registryKey: "SizeNWSE", isAnimated: false, frames: null },
    { key: "SizeNESW", label: "Diagonal Resize 2", fileName: "diagonal2.cur", registryKey: "SizeNESW", isAnimated: false, frames: null },
    { key: "SizeAll", label: "Move", fileName: "move.cur", registryKey: "SizeAll", isAnimated: false, frames: null },
    { key: "UpArrow", label: "Alternate Select", fileName: "alternate.cur", registryKey: "UpArrow", isAnimated: false, frames: null },
    { key: "Hand", label: "Link Select", fileName: "link.cur", registryKey: "Hand", isAnimated: false, frames: null }
  ]);
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [animProgress, setAnimProgress] = useState<number>(0);

  // Set rotation base image automatically to active frame on load
  useEffect(() => {
    if (activeFrame && !rotationBaseImage) {
      setRotationBaseImage(activeFrame.image_data);
    }
  }, [activeFrame]);

  // Global ticking helper for animated hover slots
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimProgress((p) => (p + 1) % 120);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // --- GENERATING THE SHARINGAN SPIN SEQUENCE ---
  const handleGenerateRotation = () => {
    if (!rotationBaseImage) {
      showToast("Please upload or draw a cursor base first.");
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = img.width || 32;
      const h = img.height || 32;

      const generatedFrames: ProjectFrame[] = [];
      const stepAngle = (rotationDir === "cw" ? 360 : -360) / rotationFrameCount;

      for (let i = 0; i < rotationFrameCount; i++) {
        const offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = w;
        offscreenCanvas.height = h;
        const ctx = offscreenCanvas.getContext("2d");
        if (!ctx) continue;

        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, w, h);

        // Save current context
        ctx.save();
        // Translate to center point
        ctx.translate(w / 2, h / 2);
        // Rotate by dynamic degree
        const angleRad = (i * stepAngle * Math.PI) / 180;
        ctx.rotate(angleRad);
        // Draw centered
        ctx.drawImage(img, -w / 2, -h / 2);
        ctx.restore();

        generatedFrames.push({
          frame_index: i,
          duration_ms: rotationSpeed,
          width: w,
          height: h,
          hotspot_x: activeFrame ? activeFrame.hotspot_x : Math.round(w / 2),
          hotspot_y: activeFrame ? activeFrame.hotspot_y : Math.round(h / 2),
          image_data: offscreenCanvas.toDataURL("image/png")
        });
      }

      onFramesUpdated(generatedFrames);
      showToast(`Generated ${rotationFrameCount}-frame smooth Sharingan spinning animation!`);
    };
    img.src = rotationBaseImage;
  };

  const handleRotationUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setRotationBaseImage(event.target.result as string);
        showToast("Loaded custom image for auto-rotation generator!");
      }
    };
    reader.readAsDataURL(file);
  };

  // --- FEATURE 2: HOTSPOT COORD CLICK HANDLER ---
  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeFrame) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cellWidth = rect.width / activeFrame.width;
    const cellHeight = rect.height / activeFrame.height;

    const clickX = Math.floor((e.clientX - rect.left) / cellWidth);
    const clickY = Math.floor((e.clientY - rect.top) / cellHeight);

    const clampedX = Math.max(0, Math.min(activeFrame.width - 1, clickX));
    const clampedY = Math.max(0, Math.min(activeFrame.height - 1, clickY));

    onFrameUpdated({
      ...activeFrame,
      hotspot_x: clampedX,
      hotspot_y: clampedY
    });
    showToast(`Locked precise click Hotspot: (${clampedX}, ${clampedY})`);
  };

  // --- REAL-TIME TARGET SANDBOX LOGIC ---
  const handleSandboxClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeFrame || !sandboxRef.current) return;
    const rect = sandboxRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if clicked close enough to target (bullseye center is sandboxTarget)
    const tx = (sandboxTarget.x / 100) * rect.width;
    const ty = (sandboxTarget.y / 100) * rect.height;
    
    const dist = Math.hypot(clickX - tx, clickY - ty);

    // Create stylish floating splash particles
    const colorSpectrum = ["#22C55E", "#E8793A", "#38BDF8", "#F43F5E", "#F59E0B"];
    const newParticles = Array.from({ length: 8 }).map((_, idx) => ({
      id: Date.now() + idx,
      x: clickX,
      y: clickY,
      color: colorSpectrum[Math.floor(Math.random() * colorSpectrum.length)]
    }));

    setSandboxFloatingParticles((p) => [...p, ...newParticles]);
    setTimeout(() => {
      setSandboxFloatingParticles((p) => p.filter((item) => !newParticles.find((np) => np.id === item.id)));
    }, 1000);

    if (dist < 25) {
      setSandboxHits((h) => h + 1);
      // Move target to a new randomized spot
      setSandboxTarget({
        x: 15 + Math.random() * 70,
        y: 15 + Math.random() * 70
      });
      showToast("🎯 DIRECT HIT! Perfect cursor alignment!");
    } else {
      showToast("Clicked! Watch the cursor tip target registry.");
    }
  };

  // Compile active frame to raw custom .cur Base64 Data URL for the Sandbox
  const getCompiledCurUrl = () => {
    if (!activeFrame) return "auto";
    try {
      const bytes = writeCurFile(
        activeFrame.width,
        activeFrame.height,
        activeFrame.hotspot_x,
        activeFrame.hotspot_y,
        activeFrame.image_data
      );
      const binary = bytes.reduce((acc, b) => acc + String.fromCharCode(b), "");
      const base64 = btoa(binary);
      return `url('data:image/x-icon;base64,${base64}') ${activeFrame.hotspot_x} ${activeFrame.hotspot_y}, auto`;
    } catch (err) {
      return "auto";
    }
  };

  // --- FEATURE 3: DYNAMIC EFFECT FILTERS & HUE CYCLING ---
  const applyEffectFiltersToTimeline = () => {
    if (project.frames.length === 0) return;

    const promises = project.frames.map((frame, idx) => {
      return new Promise<ProjectFrame>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = frame.width;
          canvas.height = frame.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(frame);
            return;
          }

          ctx.imageSmoothingEnabled = false;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // 1. Shadow settings
          ctx.save();
          ctx.shadowColor = shadowColor;
          ctx.shadowBlur = shadowBlur;
          ctx.shadowOffsetX = shadowOffsetX;
          ctx.shadowOffsetY = shadowOffsetY;

          // 2. Glow settings
          if (glowBlur > 0) {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = glowBlur;
          }

          // 3. RGB Hue cycling shift across frames
          if (rainbowShiftEnabled) {
            const shiftFraction = idx / project.frames.length;
            const deg = Math.round(shiftFraction * 360 * rainbowCycles);
            ctx.filter = `hue-rotate(${deg}deg)`;
          }

          ctx.drawImage(img, 0, 0);
          ctx.restore();

          resolve({
            ...frame,
            image_data: canvas.toDataURL("image/png")
          });
        };
        img.onerror = () => resolve(frame);
        img.src = frame.image_data;
      });
    });

    Promise.all(promises).then((processed) => {
      onFramesUpdated(processed);
      showToast("Applied visual filter pipeline to all animation frames!");
    });
  };

  // --- FEATURE 4: SCHEME SCHEDULING BUILDER ---
  const assignCurrentToSlot = (slotKey: string) => {
    if (project.frames.length === 0) return;
    
    const isAnimatedSlot = schemeSlots.find(s => s.key === slotKey)?.isAnimated;

    // Build the frames structure for the slot
    let slotFrames = project.frames.map((f) => ({
      pngDataUrl: f.image_data,
      durationMs: f.duration_ms,
      hotspotX: f.hotspot_x,
      hotspotY: f.hotspot_y
    }));

    if (!isAnimatedSlot) {
      // Static cursors take only the active/first frame
      const frame = activeFrame || project.frames[0];
      slotFrames = [{
        pngDataUrl: frame.image_data,
        durationMs: frame.duration_ms,
        hotspotX: frame.hotspot_x,
        hotspotY: frame.hotspot_y
      }];
    }

    setSchemeSlots((slots) =>
      slots.map((s) =>
        s.key === slotKey
          ? { ...s, frames: slotFrames }
          : s
      )
    );
    showToast(`Assigned current project to [${slotKey}] state!`);
  };

  const uploadCustomToSlot = (slotKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) return;
      const dataUrl = event.target.result as string;

      setSchemeSlots((slots) =>
        slots.map((s) =>
          s.key === slotKey
            ? {
                ...s,
                frames: [{
                  pngDataUrl: dataUrl,
                  durationMs: 100,
                  hotspotX: 0,
                  hotspotY: 0
                }]
              }
            : s
        )
      );
      showToast(`Uploaded custom graphic for ${slotKey}.`);
    };
    reader.readAsDataURL(file);
  };

  const removeSlotContent = (slotKey: string) => {
    setSchemeSlots((slots) =>
      slots.map((s) =>
        s.key === slotKey ? { ...s, frames: null } : s
      )
    );
    showToast(`Cleared [${slotKey}] assignment.`);
  };

  // --- AUTOMATED .INF EXPORTER & ZIP PACKAGE GENERATOR ---
  const handleExportScheme = async () => {
    // Check if at least one slot is populated
    const activeSlotsCount = schemeSlots.filter((s) => s.frames !== null).length;
    if (activeSlotsCount === 0) {
      showToast("Please assign at least one cursor to map a Windows Scheme!");
      return;
    }

    const zip = new JSZip();
    const folderName = schemeName.trim().replace(/\s+/g, "_") || "Custom_Cursors";
    
    showToast("Compiling binary cursor files...");

    // 1. Render & write individual cursor files
    schemeSlots.forEach((slot) => {
      if (!slot.frames) return;

      try {
        if (slot.isAnimated && slot.frames.length > 1) {
          // Compile animated cursor .ani
          const aniFramesInput = slot.frames.map((f) => ({
            width: 32,
            height: 32,
            hotspotX: f.hotspotX,
            hotspotY: f.hotspotY,
            pngDataUrl: f.pngDataUrl,
            durationMs: f.durationMs
          }));
          const bytes = writeAniFile(aniFramesInput);
          zip.file(slot.fileName, bytes);
        } else {
          // Compile static .cur
          const firstFrame = slot.frames[0];
          const bytes = writeCurFile(
            32,
            32,
            firstFrame.hotspotX,
            firstFrame.hotspotY,
            firstFrame.pngDataUrl
          );
          zip.file(slot.fileName, bytes);
        }
      } catch (e) {
        console.error("Failed to compile " + slot.key, e);
      }
    });

    // 2. Generate install.inf string content dynamically
    const cleanFileName = (slotKey: string) => {
      const s = schemeSlots.find((slot) => slot.key === slotKey);
      return s && s.frames ? s.fileName : "normal.cur"; // Fallback to normal
    };

    const infContent = `; =========================================================
; ${schemeName} - Windows Cursor Scheme Installer
; Generated Automatically via Cursor Animator Studio
; =========================================================

[Version]
signature="$CHICAGO$"
Provider="Cursor Animator Studio"

[DefaultInstall]
CopyFiles = Scheme.Cur
AddReg    = Scheme.Reg

[DestinationDirs]
Scheme.Cur = 10,"Cursors\\${folderName}"

[Scheme.Reg]
HKCU,"Control Panel\\Cursors\\Schemes","${schemeName}",0x00020000,"%10%\\Cursors\\${folderName}\\${cleanFileName("Arrow")},%10%\\Cursors\\${folderName}\\${cleanFileName("Help")},%10%\\Cursors\\${folderName}\\${cleanFileName("AppStarting")},%10%\\Cursors\\${folderName}\\${cleanFileName("Wait")},%10%\\Cursors\\${folderName}\\${cleanFileName("Crosshair")},%10%\\Cursors\\${folderName}\\${cleanFileName("IBeam")},%10%\\Cursors\\${folderName}\\${cleanFileName("NWPen")},%10%\\Cursors\\${folderName}\\${cleanFileName("No")},%10%\\Cursors\\${folderName}\\${cleanFileName("SizeNS")},%10%\\Cursors\\${folderName}\\${cleanFileName("SizeWE")},%10%\\Cursors\\${folderName}\\${cleanFileName("SizeNWSE")},%10%\\Cursors\\${folderName}\\${cleanFileName("SizeNESW")},%10%\\Cursors\\${folderName}\\${cleanFileName("SizeAll")},%10%\\Cursors\\${folderName}\\${cleanFileName("UpArrow")},%10%\\Cursors\\${folderName}\\${cleanFileName("Hand")}"

; Direct installation registration for instantaneous activation
HKCU,"Control Panel\\Cursors",,0x00020000,"${schemeName}"
HKCU,"Control Panel\\Cursors",Arrow,0x00020000,"%10%\\Cursors\\${folderName}\\${cleanFileName("Arrow")}"
HKCU,"Control Panel\\Cursors",Help,0x00020000,"%10%\\Cursors\\${folderName}\\${cleanFileName("Help")}"
HKCU,"Control Panel\\Cursors",AppStarting,0x00020000,"%10%\\Cursors\\${folderName}\\${cleanFileName("AppStarting")}"
HKCU,"Control Panel\\Cursors",Wait,0x00020000,"%10%\\Cursors\\${folderName}\\${cleanFileName("Wait")}"
HKCU,"Control Panel\\Cursors",Crosshair,0x00020000,"%10%\\Cursors\\${folderName}\\${cleanFileName("Crosshair")}"
HKCU,"Control Panel\\Cursors",IBeam,0x00020000,"%10%\\Cursors\\${folderName}\\${cleanFileName("IBeam")}"
HKCU,"Control Panel\\Cursors",NWPen,0x00020000,"%10%\\Cursors\\${folderName}\\${cleanFileName("NWPen")}"
HKCU,"Control Panel\\Cursors",No,0x00020000,"%10%\\Cursors\\${folderName}\\${cleanFileName("No")}"
HKCU,"Control Panel\\Cursors",SizeNS,0x00020000,"%10%\\Cursors\\${folderName}\\${cleanFileName("SizeNS")}"
HKCU,"Control Panel\\Cursors",SizeWE,0x00020000,"%10%\\Cursors\\${folderName}\\${cleanFileName("SizeWE")}"
HKCU,"Control Panel\\Cursors",SizeNWSE,0x00020000,"%10%\\Cursors\\${folderName}\\${cleanFileName("SizeNWSE")}"
HKCU,"Control Panel\\Cursors",SizeNESW,0x00020000,"%10%\\Cursors\\${folderName}\\${cleanFileName("SizeNESW")}"
HKCU,"Control Panel\\Cursors",SizeAll,0x00020000,"%10%\\Cursors\\${folderName}\\${cleanFileName("SizeAll")}"
HKCU,"Control Panel\\Cursors",UpArrow,0x00020000,"%10%\\Cursors\\${folderName}\\${cleanFileName("UpArrow")}"
HKCU,"Control Panel\\Cursors",Hand,0x00020000,"%10%\\Cursors\\${folderName}\\${cleanFileName("Hand")}"

[Scheme.Cur]
${schemeSlots.filter(s => s.frames !== null).map((s) => s.fileName).join("\r\n")}

[Strings]
`;

    zip.file("install.inf", infContent);

    // 3. Trigger compilation & download
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = `${folderName}_windows_scheme.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("🎉 Scheme Builder ZIP downloaded! Right-click 'install.inf' and click 'Install' on Windows.");
  };

  // Helper: Live preview of assigned slot frames
  const getSlotPreviewUrl = (slot: SchemeSlot) => {
    if (!slot.frames || slot.frames.length === 0) return "";
    const total = slot.frames.length;
    const currentFrameIdx = Math.floor(animProgress / Math.max(1, Math.round(120 / total))) % total;
    return slot.frames[currentFrameIdx]?.pngDataUrl || "";
  };

  return (
    <div className="rounded-[20px] bg-white/[0.03] border border-white/10 p-5 space-y-5 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Decorative Glow Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8793A]/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4.5 h-4.5 text-[#E8793A]" />
          <span>Advanced Studio Tools</span>
        </h3>
        <span className="text-[10px] font-mono text-[#E8793A] bg-[#E8793A]/10 border border-[#E8793A]/20 px-2 py-0.5 rounded">V2.0 Core</span>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-black/40 rounded-xl border border-white/5">
        {[
          { id: "rotation", label: "Auto-Rotate", icon: RotateCw },
          { id: "hotspot", label: "Hotspot Grid", icon: Target },
          { id: "pipeline", label: "FX Filters", icon: Sliders },
          { id: "scheme", label: "Scheme Builder", icon: Layers }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex flex-col items-center justify-center py-2 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-[#E8793A] text-[#1C1512] shadow-md shadow-[#E8793A]/10"
                  : "text-[#B8ADA3] hover:text-[#F3EDE7] hover:bg-white/[0.02]"
              }`}
            >
              <Icon className="w-3.5 h-3.5 mb-1" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Sharingan Auto-Rotation Generator */}
      {activeTab === "rotation" && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white flex items-center gap-1">
              <span>🌀 Sharingan Auto-Spin Engine</span>
            </h4>
            <p className="text-[10px] text-[#B8ADA3] leading-snug">
              Turn a single static custom pointer image into a perfectly rotating 360° animated cursor.
            </p>
          </div>

          {/* Quick upload or current project toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                if (activeFrame) {
                  setRotationBaseImage(activeFrame.image_data);
                  showToast("Loaded current active frame as base.");
                }
              }}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[11px] font-semibold text-[#F3EDE7] hover:bg-white/10 transition-colors cursor-pointer"
            >
              Use Active Frame
            </button>
            <button
              onClick={() => rotationUploadRef.current?.click()}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[11px] font-semibold text-[#F3EDE7] hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3 h-3 text-[#E8793A]" />
              <span>Upload Static</span>
            </button>
            <input
              type="file"
              ref={rotationUploadRef}
              onChange={handleRotationUpload}
              accept="image/png, image/svg+xml"
              className="hidden"
            />
          </div>

          {/* Base Graphic Display */}
          {rotationBaseImage && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/30 border border-white/5">
              <div className="w-12 h-12 rounded bg-neutral-900 border border-white/10 flex items-center justify-center p-1.5 relative overflow-hidden">
                <img src={rotationBaseImage} alt="Base" className="max-w-full max-h-full object-contain pixelated" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-white truncate">Base Graphic Selected</p>
                <p className="text-[9px] text-[#B8ADA3]">Ready for rotation compiling</p>
              </div>
              <button
                onClick={() => setRotationBaseImage(null)}
                className="text-neutral-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Controls */}
          <div className="space-y-3 bg-black/20 p-3 rounded-xl border border-white/5">
            {/* Direction */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-400">Rotation Direction</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setRotationDir("cw")}
                  className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 ${
                    rotationDir === "cw" ? "bg-[#E8793A]/20 text-[#E8793A] border border-[#E8793A]/30" : "bg-neutral-800 text-neutral-400 border border-transparent"
                  }`}
                >
                  <RotateCw className="w-3 h-3" /> Clockwise
                </button>
                <button
                  onClick={() => setRotationDir("ccw")}
                  className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 ${
                    rotationDir === "ccw" ? "bg-[#E8793A]/20 text-[#E8793A] border border-[#E8793A]/30" : "bg-neutral-800 text-neutral-400 border border-transparent"
                  }`}
                >
                  <RotateCcw className="w-3 h-3" /> Counter-CW
                </button>
              </div>
            </div>

            {/* Frame Count Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="font-bold text-neutral-400">Sequence Frame Count</span>
                <span className="text-white font-bold">{rotationFrameCount} frames</span>
              </div>
              <input
                type="range"
                min="8"
                max="36"
                step="4"
                value={rotationFrameCount}
                onChange={(e) => setRotationFrameCount(parseInt(e.target.value))}
                className="w-full h-1 bg-neutral-900 rounded-lg accent-[#E8793A] cursor-pointer"
              />
              <p className="text-[8px] text-neutral-500 italic">Smooth 15-degree increments recommended for sharingan spinning effect.</p>
            </div>

            {/* Speed Delay Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="font-bold text-neutral-400">Frame Duration (Delay)</span>
                <span className="text-white font-bold">{rotationSpeed} ms</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="10"
                value={rotationSpeed}
                onChange={(e) => setRotationSpeed(parseInt(e.target.value))}
                className="w-full h-1 bg-neutral-900 rounded-lg accent-[#E8793A] cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateRotation}
            disabled={!rotationBaseImage}
            className="w-full py-2 bg-[#E8793A] hover:bg-[#F2925C] disabled:opacity-40 text-[#1C1512] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-[#E8793A]/10 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            <span>Auto-Generate Rotating Cursor Sequence</span>
          </button>
        </div>
      )}

      {/* Tab 2: Interactive Zoom Hotspot Grid & Target Sandbox */}
      {activeTab === "hotspot" && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white">🎯 Visual Hotspot Grid & Sandbox</h4>
            <p className="text-[10px] text-[#B8ADA3] leading-snug">
              Set the precise click alignment point and test click registering live in the Practice Arena.
            </p>
          </div>

          {activeFrame ? (
            <div className="space-y-4">
              {/* Hotspot Zoom Grid Display */}
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-neutral-500 block tracking-wider">Zoom Grid (Click to lock coordinate)</span>
                <div 
                  className="relative mx-auto rounded-xl border-2 border-white/10 bg-neutral-950 overflow-hidden cursor-crosshair flex items-center justify-center"
                  style={{ width: "200px", height: "200px" }}
                  onClick={handleGridClick}
                >
                  {/* Backdrop pixelated preview zoomed */}
                  <img 
                    src={activeFrame.image_data} 
                    alt="Zoom" 
                    className="w-full h-full object-contain pixelated pointer-events-none opacity-90" 
                  />
                  
                  {/* Crosshair target overlay */}
                  <div 
                    className="absolute pointer-events-none flex items-center justify-center"
                    style={{
                      left: `calc(${(activeFrame.hotspot_x / activeFrame.width) * 100}% - 8px)`,
                      top: `calc(${(activeFrame.hotspot_y / activeFrame.height) * 100}% - 8px)`,
                      width: "16px",
                      height: "16px"
                    }}
                  >
                    {/* Ring */}
                    <div className="absolute w-full h-full rounded-full border-2 border-[#E8793A] animate-ping opacity-60"></div>
                    <div className="absolute w-3.5 h-3.5 rounded-full border border-[#E8793A]"></div>
                    {/* Tiny Center Dot */}
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E8793A]"></div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-[#B8ADA3] font-mono px-1">
                  <span>Current click coords:</span>
                  <span className="text-[#E8793A] font-bold">X: {activeFrame.hotspot_x}, Y: {activeFrame.hotspot_y}</span>
                </div>
              </div>

              {/* Real-time Target Practice Arena Sandbox */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase font-bold text-neutral-500 block tracking-wider">Practice Arena (Hover & Target Practice)</span>
                  <span className="text-[10px] font-bold text-green-400">🎯 Hits: {sandboxHits}</span>
                </div>
                
                <div 
                  ref={sandboxRef}
                  onClick={handleSandboxClick}
                  className="relative h-28 w-full rounded-xl border border-dashed border-white/20 bg-black/40 overflow-hidden flex items-center justify-center select-none"
                  style={{ cursor: getCompiledCurUrl() }}
                >
                  <p className="text-[9px] text-neutral-500 pointer-events-none text-center">
                    Hover here to activate custom cursor.<br/>Click the bullseye to test registry!
                  </p>

                  {/* Bullseye target to click on */}
                  <div 
                    className="absolute w-6 h-6 flex items-center justify-center cursor-pointer group transition-all duration-300"
                    style={{
                      left: `calc(${sandboxTarget.x}% - 12px)`,
                      top: `calc(${sandboxTarget.y}% - 12px)`
                    }}
                  >
                    <div className="absolute w-full h-full rounded-full bg-red-500/20 border border-red-500/50 animate-pulse"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-white border border-red-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                    </div>
                  </div>

                  {/* Clicking particles */}
                  {sandboxFloatingParticles.map((pt) => (
                    <div
                      key={pt.id}
                      className="absolute w-1.5 h-1.5 rounded-full pointer-events-none animate-ping"
                      style={{
                        left: pt.x,
                        top: pt.y,
                        backgroundColor: pt.color,
                        transform: "translate(-50%, -50%)"
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 text-center py-6">No frame available. Start drawing to set coordinates.</p>
          )}
        </div>
      )}

      {/* Tab 3: Dynamic Visual Effect Filters Pipeline */}
      {activeTab === "pipeline" && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-white flex items-center gap-1">
              <span>🌈 Dynamic Filter Pipeline</span>
            </h4>
            <p className="text-[10px] text-[#B8ADA3] leading-snug">
              Bake shadows, vibrant neon-glow highlights, and continuous hue cycling across your entire animation.
            </p>
          </div>

          <div className="space-y-3 bg-black/20 p-3 rounded-xl border border-white/5">
            {/* Glow highlighting */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px]">
                <span className="font-bold text-neutral-400">Neon Glow Highlight</span>
                <span className="text-white font-bold">{glowBlur}px blur</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={glowColor}
                  onChange={(e) => setGlowColor(e.target.value)}
                  className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer"
                />
                <input
                  type="range"
                  min="0"
                  max="12"
                  value={glowBlur}
                  onChange={(e) => setGlowBlur(parseInt(e.target.value))}
                  className="flex-1 h-1 bg-neutral-900 rounded-lg accent-[#E8793A] cursor-pointer"
                />
              </div>
            </div>

            {/* Drop Shadow Offset */}
            <div className="space-y-1.5 border-t border-white/5 pt-2">
              <div className="flex justify-between text-[10px]">
                <span className="font-bold text-neutral-400">Shadow Offset (X/Y) & Blur</span>
                <span className="text-white font-bold">({shadowOffsetX}px, {shadowOffsetY}px) - {shadowBlur}px</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-0.5">
                  <span className="text-[8px] text-neutral-500">Offset X</span>
                  <input
                    type="range"
                    min="-8"
                    max="8"
                    value={shadowOffsetX}
                    onChange={(e) => setShadowOffsetX(parseInt(e.target.value))}
                    className="w-full h-1 bg-neutral-900 rounded-lg accent-[#E8793A] cursor-pointer"
                  />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] text-neutral-500">Offset Y</span>
                  <input
                    type="range"
                    min="-8"
                    max="8"
                    value={shadowOffsetY}
                    onChange={(e) => setShadowOffsetY(parseInt(e.target.value))}
                    className="w-full h-1 bg-neutral-900 rounded-lg accent-[#E8793A] cursor-pointer"
                  />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] text-neutral-500">Blur Radius</span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={shadowBlur}
                    onChange={(e) => setShadowBlur(parseInt(e.target.value))}
                    className="w-full h-1 bg-neutral-900 rounded-lg accent-[#E8793A] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* RGB Rainbow Hue Cycling Shift */}
            <div className="space-y-2 border-t border-white/5 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-neutral-400">RGB Spectrum Hue-Cycling</span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rainbowShiftEnabled}
                    onChange={(e) => setRainbowShiftEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-7 h-4 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height-3 after:h-3 after:w-3 after:transition-all peer-checked:bg-[#E8793A]"></div>
                </label>
              </div>

              {rainbowShiftEnabled && (
                <div className="space-y-1 animate-fade-in">
                  <div className="flex justify-between text-[10px]">
                    <span className="font-bold text-neutral-500">Spectrum Phase Cycles</span>
                    <span className="text-[#E8793A] font-bold">{rainbowCycles} full loop(s)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={rainbowCycles}
                    onChange={(e) => setRainbowCycles(parseInt(e.target.value))}
                    className="w-full h-1 bg-neutral-900 rounded-lg accent-[#E8793A] cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={applyEffectFiltersToTimeline}
            className="w-full py-2 bg-gradient-to-r from-[#E8793A] to-[#EF4444] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-[#E8793A]/10 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Bake & Commit Effects Into Frames</span>
          </button>
        </div>
      )}

      {/* Tab 4: Windows Cursor Scheme Builder & Installer Exporter */}
      {activeTab === "scheme" && (
        <div className="space-y-4 animate-fade-in">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-white">🗂️ Windows Multi-Cursor Scheme Builder</h4>
              <span className="text-[9px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded">INF Support</span>
            </div>
            <p className="text-[10px] text-[#B8ADA3] leading-snug">
              Map up to 15 Windows states. Export a complete cursor pack with a 1-click INF right-click installer!
            </p>
          </div>

          {/* Scheme Naming */}
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold text-neutral-500 block">Desktop Scheme Name</span>
            <input
              type="text"
              value={schemeName}
              onChange={(e) => setSchemeName(e.target.value)}
              placeholder="e.g. Naruto Shinobi Pack..."
              className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white focus:border-[#E8793A] focus:outline-none"
            />
          </div>

          {/* Slots Mapper Grid */}
          <div className="space-y-1.5">
            <span className="text-[9px] uppercase font-bold text-neutral-500 block">Mapping Table (Hover for animations)</span>
            <div className="max-h-56 overflow-y-auto border border-white/5 rounded-xl bg-black/30 divide-y divide-white/5 custom-scrollbar pr-1">
              {schemeSlots.map((slot) => {
                const isAssigned = slot.frames !== null;
                return (
                  <div 
                    key={slot.key}
                    onMouseEnter={() => setHoveredSlot(slot.key)}
                    onMouseLeave={() => setHoveredSlot(null)}
                    className="flex items-center gap-2.5 p-2 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Tiny visual thumbnail */}
                    <div className="w-7 h-7 rounded bg-neutral-900 border border-white/10 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                      {isAssigned ? (
                        <img 
                          src={getSlotPreviewUrl(slot)} 
                          alt="Slot" 
                          className="max-w-full max-h-full object-contain pixelated" 
                        />
                      ) : (
                        <span className="text-[8px] text-neutral-600 font-bold">EMPTY</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-white truncate">{slot.label}</p>
                      <p className="text-[8px] text-neutral-500 font-mono truncate">Registry: {slot.registryKey} ({slot.isAnimated ? "Animated .ani" : "Static .cur"})</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => assignCurrentToSlot(slot.key)}
                        className="px-2 py-1 rounded text-[9px] font-bold bg-[#E8793A]/10 text-[#E8793A] border border-[#E8793A]/20 hover:bg-[#E8793A]/20 transition-colors cursor-pointer"
                        title="Map your current project's frames to this cursor state"
                      >
                        Use Active
                      </button>

                      {isAssigned && (
                        <button
                          onClick={() => removeSlotContent(slot.key)}
                          className="p-1 hover:text-red-400 text-neutral-500 transition-colors cursor-pointer"
                          title="Clear mapped content"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exporter triggers */}
          <button
            onClick={handleExportScheme}
            className="w-full py-2 bg-gradient-to-r from-orange-500 via-[#E8793A] to-yellow-500 hover:scale-[1.01] text-[#1C1512] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#E8793A]/10 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Generate 1-Click Scheme ZIP Installer</span>
          </button>
          
          <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-[9px] text-[#B8ADA3] leading-normal flex gap-2">
            <ShieldAlert className="w-4 h-4 text-[#38BDF8] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#38BDF8]">How to install on Windows:</strong> Extract the downloaded .ZIP, right-click the <code className="text-white font-semibold">install.inf</code> file, and click <strong className="text-white">"Install"</strong>. Your entire theme will apply instantly!
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
