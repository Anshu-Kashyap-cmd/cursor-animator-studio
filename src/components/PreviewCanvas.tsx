import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Maximize2, Move, AlignCenter, Layers, Pencil, Sparkles, Eraser, Crosshair, Paintbrush } from "lucide-react";
import { ProjectFrame } from "../types.ts";

interface PreviewCanvasProps {
  frames: ProjectFrame[];
  activeFrameIndex: number;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  loop: boolean;
  setLoop: (loop: boolean) => void;
  onHotspotChanged: (x: number, y: number, allFrames: boolean) => void;
  onActiveFrameChanged: (index: number) => void;
  hue?: number;
  saturation?: number;
  brightness?: number;
  onFrameUpdated?: (updatedFrame: ProjectFrame) => void;
  selectedColor?: string;
  onionSkinPrev: boolean;
  setOnionSkinPrev: (v: boolean) => void;
  onionSkinNext: boolean;
  setOnionSkinNext: (v: boolean) => void;
  showGridOverlay?: boolean;
  onionSkinOpacity?: number;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  frames,
  activeFrameIndex,
  isPlaying,
  setIsPlaying,
  speed,
  setSpeed,
  loop,
  setLoop,
  onHotspotChanged,
  onActiveFrameChanged,
  hue = 0,
  saturation = 100,
  brightness = 100,
  onFrameUpdated,
  selectedColor = "#E8793A",
  onionSkinPrev,
  setOnionSkinPrev,
  onionSkinNext,
  setOnionSkinNext,
  showGridOverlay = false,
  onionSkinOpacity = 0.25,
}) => {
  const activeFrame = frames[activeFrameIndex] || null;

  const [applyToAll, setApplyToAll] = useState(true);
  const [currentPlaybackIndex, setCurrentPlaybackIndex] = useState(activeFrameIndex);
  
  const [tool, setTool] = useState<"hotspot" | "pencil" | "smart_brush" | "eraser" | "bucket">("hotspot");
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [smoothedPoint, setSmoothedPoint] = useState<{ x: number; y: number } | null>(null);
  const [renderCount, setRenderCount] = useState(0);

  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const triggerRender = () => setRenderCount((c) => c + 1);

  // Initialize and sync offscreen canvas when frame or index changes
  useEffect(() => {
    if (isDrawing) return;
    if (!activeFrame) return;

    const canvas = document.createElement("canvas");
    canvas.width = activeFrame.width;
    canvas.height = activeFrame.height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        offscreenCanvasRef.current = canvas;
        triggerRender();
      };
      img.src = activeFrame.image_data;
    }
  }, [activeFrameIndex, activeFrame?.image_data]);

  const hexToRgba = (hex: string, alpha: number): string => {
    let cleanHex = hex.replace("#", "");
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split("").map((c) => c + c).join("");
    }
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const drawBresenhamLine = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    plot: (x: number, y: number) => void
  ) => {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let cx = x0;
    let cy = y0;

    while (true) {
      plot(cx, cy);
      if (cx === x1 && cy === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        cx += sx;
      }
      if (e2 < dx) {
        err += dx;
        cy += sy;
      }
    }
  };

  const getPixelColor = (data: Uint8ClampedArray, x: number, y: number, width: number) => {
    const idx = (y * width + x) * 4;
    return {
      r: data[idx],
      g: data[idx + 1],
      b: data[idx + 2],
      a: data[idx + 3],
    };
  };

  const setPixelColor = (
    data: Uint8ClampedArray,
    x: number,
    y: number,
    color: { r: number; g: number; b: number; a: number },
    width: number
  ) => {
    const idx = (y * width + x) * 4;
    data[idx] = color.r;
    data[idx + 1] = color.g;
    data[idx + 2] = color.b;
    data[idx + 3] = color.a;
  };

  const matchColor = (
    c1: { r: number; g: number; b: number; a: number },
    c2: { r: number; g: number; b: number; a: number }
  ) => {
    return (
      Math.abs(c1.r - c2.r) < 15 &&
      Math.abs(c1.g - c2.g) < 15 &&
      Math.abs(c1.b - c2.b) < 15 &&
      Math.abs(c1.a - c2.a) < 15
    );
  };

  const parseHexColor = (hex: string) => {
    let cleanHex = hex.replace("#", "");
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split("").map((c) => c + c).join("");
    }
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    return { r, g, b, a: 255 };
  };

  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = offscreenCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const targetColor = getPixelColor(data, startX, startY, width);
    const fillRgb = parseHexColor(fillColor);

    if (
      targetColor.r === fillRgb.r &&
      targetColor.g === fillRgb.g &&
      targetColor.b === fillRgb.b &&
      targetColor.a === fillRgb.a
    ) {
      return;
    }

    const queue: [number, number][] = [[startX, startY]];
    const visited = new Uint8Array(width * height);

    while (queue.length > 0) {
      const [cx, cy] = queue.shift()!;
      const idx = cy * width + cx;
      if (visited[idx]) continue;
      visited[idx] = 1;

      const currentColor = getPixelColor(data, cx, cy, width);
      if (matchColor(currentColor, targetColor)) {
        setPixelColor(data, cx, cy, fillRgb, width);

        if (cx > 0) queue.push([cx - 1, cy]);
        if (cx < width - 1) queue.push([cx + 1, cy]);
        if (cy > 0) queue.push([cx, cy - 1]);
        if (cy < height - 1) queue.push([cx, cy + 1]);
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  const drawStroke = (x1: number, y1: number, x2: number, y2: number) => {
    const canvas = offscreenCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = selectedColor;

    if (tool === "pencil") {
      drawBresenhamLine(x1, y1, x2, y2, (cx, cy) => {
        ctx.fillRect(cx, cy, 1, 1);
      });
    } else if (tool === "smart_brush") {
      // Automatic smoothing and anti-aliasing while drawing
      drawBresenhamLine(x1, y1, x2, y2, (cx, cy) => {
        // Main solid stroke pixel
        ctx.fillStyle = selectedColor;
        ctx.fillRect(cx, cy, 1, 1);

        // Anti-aliased side-shading
        ctx.fillStyle = hexToRgba(selectedColor, 0.35);
        const neighbors = [
          { x: cx - 1, y: cy },
          { x: cx + 1, y: cy },
          { x: cx, y: cy - 1 },
          { x: cx, y: cy + 1 },
        ];
        neighbors.forEach((n) => {
          if (n.x >= 0 && n.x < canvas.width && n.y >= 0 && n.y < canvas.height) {
            ctx.fillRect(n.x, n.y, 1, 1);
          }
        });
      });
    } else if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      drawBresenhamLine(x1, y1, x2, y2, (cx, cy) => {
        ctx.fillRect(cx, cy, 1, 1);
      });
      ctx.globalCompositeOperation = "source-over";
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = editCanvasRef.current;
    if (!canvas || !activeFrame) return;

    // Pause playback when drawing
    setIsPlaying(false);

    const rect = canvas.getBoundingClientRect();
    const scaleX = activeFrame.width / rect.width;
    const scaleY = activeFrame.height / rect.height;

    const clickX = Math.round((e.clientX - rect.left) * scaleX);
    const clickY = Math.round((e.clientY - rect.top) * scaleY);

    const x = Math.max(0, Math.min(activeFrame.width - 1, clickX));
    const y = Math.max(0, Math.min(activeFrame.height - 1, clickY));

    if (tool === "hotspot") {
      onHotspotChanged(x, y, applyToAll);
      return;
    }

    if (tool === "bucket") {
      floodFill(x, y, selectedColor);
      triggerRender();
      if (offscreenCanvasRef.current && onFrameUpdated) {
        onFrameUpdated({
          ...activeFrame,
          image_data: offscreenCanvasRef.current.toDataURL("image/png"),
        });
      }
      return;
    }

    setIsDrawing(true);
    setLastPoint({ x, y });
    setSmoothedPoint({ x, y });

    // Draw single starting pixel
    drawStroke(x, y, x, y);
    triggerRender();
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !activeFrame || tool === "hotspot") return;
    const canvas = editCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = activeFrame.width / rect.width;
    const scaleY = activeFrame.height / rect.height;

    const clickX = Math.round((e.clientX - rect.left) * scaleX);
    const clickY = Math.round((e.clientY - rect.top) * scaleY);

    const x = Math.max(0, Math.min(activeFrame.width - 1, clickX));
    const y = Math.max(0, Math.min(activeFrame.height - 1, clickY));

    if (lastPoint) {
      let targetX = x;
      let targetY = y;
      if (tool === "smart_brush") {
        const smoothFactor = 0.55;
        const prevS = smoothedPoint || lastPoint;
        targetX = Math.round(prevS.x * smoothFactor + x * (1 - smoothFactor));
        targetY = Math.round(prevS.y * smoothFactor + y * (1 - smoothFactor));
        setSmoothedPoint({ x: targetX, y: targetY });
      }

      drawStroke(lastPoint.x, lastPoint.y, targetX, targetY);
      setLastPoint({ x: targetX, y: targetY });
      triggerRender();
    }
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing || !activeFrame || tool === "hotspot") return;
    setIsDrawing(false);
    setLastPoint(null);
    setSmoothedPoint(null);

    const canvas = offscreenCanvasRef.current;
    if (canvas && onFrameUpdated) {
      const updatedFrame: ProjectFrame = {
        ...activeFrame,
        image_data: canvas.toDataURL("image/png"),
      };
      onFrameUpdated(updatedFrame);
    }
  };

  const timerRef = useRef<number | null>(null);
  const playIndexRef = useRef(activeFrameIndex);

  const editCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Sync playback ref
  useEffect(() => {
    playIndexRef.current = activeFrameIndex;
    setCurrentPlaybackIndex(activeFrameIndex);
  }, [activeFrameIndex]);

  // Handle Playback Loop
  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!isPlaying || frames.length === 0) {
      return;
    }

    const playNext = () => {
      const idx = playIndexRef.current;
      const currentFrame = frames[idx];
      if (!currentFrame) return;

      const duration = currentFrame.duration_ms / speed;

      timerRef.current = window.setTimeout(() => {
        let nextIdx = idx + 1;
        if (nextIdx >= frames.length) {
          if (loop) {
            nextIdx = 0;
          } else {
            setIsPlaying(false);
            return;
          }
        }
        playIndexRef.current = nextIdx;
        setCurrentPlaybackIndex(nextIdx);
        onActiveFrameChanged(nextIdx);
        playNext();
      }, duration);
    };

    playNext();

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, frames, speed, loop, setIsPlaying, onActiveFrameChanged]);

  // Render Magnified Edit Canvas with Crosshair Hotspot & Onion Skin overlays
  useEffect(() => {
    const canvas = editCanvasRef.current;
    if (!canvas || !activeFrame) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Track active frame index to prevent drawing if frame changes during load
    const currentFrameIndex = activeFrameIndex;

    const loadImage = (src: string): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });
    };

    const render = async () => {
      // 1. Prepare images to load
      const prevFrame = activeFrameIndex > 0 ? frames[activeFrameIndex - 1] : null;
      const nextFrame = activeFrameIndex < frames.length - 1 ? frames[activeFrameIndex + 1] : null;

      const [prevImg, nextImg, activeImg] = await Promise.all([
        onionSkinPrev && prevFrame ? loadImage(prevFrame.image_data) : Promise.resolve(null),
        onionSkinNext && nextFrame ? loadImage(nextFrame.image_data) : Promise.resolve(null),
        loadImage(activeFrame.image_data),
      ]);

      // If active index has changed since we started loading, discard this render
      if (activeFrameIndex !== currentFrameIndex || !canvas) return;

      // Clear
      ctx.clearRect(0, 0, width, height);

      // 2. Draw Checkerboard Background
      const size = 16;
      for (let y = 0; y < height; y += size) {
        for (let x = 0; x < width; x += size) {
          ctx.fillStyle = (x / size + y / size) % 2 === 0 ? "rgba(30, 30, 30, 0.4)" : "rgba(15, 15, 15, 0.4)";
          ctx.fillRect(x, y, size, size);
        }
      }

      const drawTintedFrame = (img: HTMLImageElement, color: string, alpha: number) => {
        ctx.save();
        // Create offscreen canvas for tinting
        const offscreen = document.createElement("canvas");
        offscreen.width = width;
        offscreen.height = height;
        const oCtx = offscreen.getContext("2d");
        if (oCtx) {
          oCtx.imageSmoothingEnabled = false;
          oCtx.drawImage(img, 0, 0, width, height);
          oCtx.globalCompositeOperation = "source-in";
          oCtx.fillStyle = color;
          oCtx.fillRect(0, 0, width, height);
        }
        ctx.globalAlpha = alpha;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(offscreen, 0, 0, width, height);
        ctx.restore();
      };

      // 3. Draw Previous Frame Onion Skin (Green tint for historical reference)
      if (prevImg) {
        drawTintedFrame(prevImg, "rgba(16, 185, 129, 1)", onionSkinOpacity); // Emerald Green
      }

      // 4. Draw Next Frame Onion Skin (Red/Orange tint for future reference)
      if (nextImg) {
        drawTintedFrame(nextImg, "rgba(239, 68, 68, 1)", onionSkinOpacity); // Rose Red
      }

      // 5. Draw Active Frame (Full color)
      if (isDrawing && offscreenCanvasRef.current) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.filter = `hue-rotate(${hue}deg) saturate(${saturation}%) brightness(${brightness}%)`;
        ctx.drawImage(offscreenCanvasRef.current, 0, 0, width, height);
        ctx.restore();
      } else if (activeImg) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.filter = `hue-rotate(${hue}deg) saturate(${saturation}%) brightness(${brightness}%)`;
        ctx.drawImage(activeImg, 0, 0, width, height);
        ctx.restore();
      }

      // 5.5 Draw Pixel Grid Overlay if enabled
      if (showGridOverlay && activeFrame) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
        ctx.lineWidth = 0.5;
        const scaleX = width / activeFrame.width;
        const scaleY = height / activeFrame.height;
        ctx.beginPath();
        for (let x = 0; x <= activeFrame.width; x++) {
          ctx.moveTo(x * scaleX, 0);
          ctx.lineTo(x * scaleX, height);
        }
        for (let y = 0; y <= activeFrame.height; y++) {
          ctx.moveTo(0, y * scaleY);
          ctx.lineTo(width, y * scaleY);
        }
        ctx.stroke();
        ctx.restore();
      }

      // 6. Draw Hotspot Crosshair
      const hX = (activeFrame.hotspot_x / activeFrame.width) * width;
      const hY = (activeFrame.hotspot_y / activeFrame.height) * height;

      // Draw dotted coordinates lines
      ctx.strokeStyle = "rgba(232, 121, 58, 0.6)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(0, hY);
      ctx.lineTo(width, hY);
      ctx.moveTo(hX, 0);
      ctx.lineTo(hX, height);
      ctx.stroke();

      // Draw crosshair circle
      ctx.setLineDash([]);
      ctx.strokeStyle = "#E8793A";
      ctx.fillStyle = "#E8793A";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(hX, hY, 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(hX, hY, 2, 0, Math.PI * 2);
      ctx.fill();
    };

    render();
  }, [
    activeFrame,
    onionSkinPrev,
    onionSkinNext,
    activeFrameIndex,
    frames,
    hue,
    saturation,
    brightness,
    renderCount,
    isDrawing,
    showGridOverlay,
    onionSkinOpacity,
  ]);

  // Tool selection keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

      const key = e.key.toLowerCase();
      if (key === "h") {
        e.preventDefault();
        setTool("hotspot");
      } else if (key === "p") {
        e.preventDefault();
        setTool("pencil");
      } else if (key === "s") {
        e.preventDefault();
        setTool("smart_brush");
      } else if (key === "f" || key === "b") {
        e.preventDefault();
        setTool("bucket");
      } else if (key === "e") {
        e.preventDefault();
        setTool("eraser");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Render Real Size Looping Live Preview Canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || frames.length === 0) return;

    const frameToRender = frames[currentPlaybackIndex] || frames[0];
    if (!frameToRender) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = frameToRender.width;
    canvas.height = frameToRender.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Checkerboard Background
    const size = 4;
    for (let y = 0; y < canvas.height; y += size) {
      for (let x = 0; x < canvas.width; x += size) {
        ctx.fillStyle = (x / size + y / size) % 2 === 0 ? "rgba(40, 40, 40, 0.5)" : "rgba(20, 20, 20, 0.5)";
        ctx.fillRect(x, y, size, size);
      }
    }

    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.filter = `hue-rotate(${hue}deg) saturate(${saturation}%) brightness(${brightness}%)`;
      ctx.drawImage(img, 0, 0);
      ctx.restore();
    };
    img.src = frameToRender.image_data;
  }, [frames, currentPlaybackIndex, hue, saturation, brightness]);

  // Handle clicking on edit canvas to move hotspot
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = editCanvasRef.current;
    if (!canvas || !activeFrame) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = activeFrame.width / rect.width;
    const scaleY = activeFrame.height / rect.height;

    const clickX = Math.round((e.clientX - rect.left) * scaleX);
    const clickY = Math.round((e.clientY - rect.top) * scaleY);

    // Clamp values
    const hotspotX = Math.max(0, Math.min(activeFrame.width - 1, clickX));
    const hotspotY = Math.max(0, Math.min(activeFrame.height - 1, clickY));

    onHotspotChanged(hotspotX, hotspotY, applyToAll);
  };

  // Handle clicking on live 1:1 preview canvas to move hotspot
  const handlePreviewCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !activeFrame) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = activeFrame.width / rect.width;
    const scaleY = activeFrame.height / rect.height;

    const clickX = Math.round((e.clientX - rect.left) * scaleX);
    const clickY = Math.round((e.clientY - rect.top) * scaleY);

    // Clamp values
    const hotspotX = Math.max(0, Math.min(activeFrame.width - 1, clickX));
    const hotspotY = Math.max(0, Math.min(activeFrame.height - 1, clickY));

    onHotspotChanged(hotspotX, hotspotY, applyToAll);
  };

  return (
    <div className="flex flex-col items-center space-y-6 w-full">
      {/* Editor & Preview Area */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full items-stretch">
        {/* Large Interactive Magnified Editor Canvas */}
        <div className="md:col-span-3 flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.02] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-4 left-4 flex items-center space-x-2 text-xs font-medium text-[#B8ADA3]">
            <Maximize2 className="w-4 h-4 text-[#E8793A]" />
            <span>Hotspot Editor & Custom Pixel Painter</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 my-6">
            {/* Professional Drawing Tools Left Sidebar */}
            <div className="flex sm:flex-col items-center gap-1.5 p-2 rounded-2xl bg-neutral-950/80 border border-white/10 shadow-xl backdrop-blur-md">
              <button
                type="button"
                title="Set Hotspot [H] (Click/drag to define cursor's clicking point)"
                onClick={() => setTool("hotspot")}
                className={`p-2.5 rounded-xl transition-all relative cursor-pointer group/btn ${
                  tool === "hotspot"
                    ? "bg-[#E8793A] text-neutral-950 font-black scale-110 shadow-lg shadow-[#E8793A]/30"
                    : "text-[#B8ADA3] hover:text-[#F3EDE7] hover:bg-white/[0.05]"
                }`}
              >
                <Crosshair className="w-4.5 h-4.5 stroke-[2.5]" />
                <span className="absolute bottom-0 right-1 text-[8px] font-mono font-bold bg-[#1C1512]/90 px-1 rounded text-white/50 group-hover/btn:text-[#E8793A] transition-colors pointer-events-none">
                  H
                </span>
              </button>

              <div className="h-px w-5 sm:w-8 sm:h-px bg-white/10 my-1 mx-auto"></div>

              <button
                type="button"
                title="Pencil Tool [P] (Paint sharp solid pixels)"
                onClick={() => setTool("pencil")}
                className={`p-2.5 rounded-xl transition-all relative cursor-pointer group/btn ${
                  tool === "pencil"
                    ? "bg-[#E8793A] text-neutral-950 font-black scale-110 shadow-lg shadow-[#E8793A]/30"
                    : "text-[#B8ADA3] hover:text-[#F3EDE7] hover:bg-white/[0.05]"
                }`}
              >
                <Pencil className="w-4.5 h-4.5 stroke-[2.5]" />
                <span className="absolute bottom-0 right-1 text-[8px] font-mono font-bold bg-[#1C1512]/90 px-1 rounded text-white/50 group-hover/btn:text-[#E8793A] transition-colors pointer-events-none">
                  P
                </span>
              </button>

              <button
                type="button"
                title="✨ Smart Pixel Brush [S] (Stroke smoothing & curved anti-aliasing)"
                onClick={() => setTool("smart_brush")}
                className={`p-2.5 rounded-xl transition-all relative cursor-pointer group/btn ${
                  tool === "smart_brush"
                    ? "bg-[#6E5A7B] text-white font-black scale-110 shadow-lg shadow-[#6E5A7B]/40 border border-[#9d82b0]"
                    : "text-[#B8ADA3] hover:text-[#F3EDE7] hover:bg-white/[0.05]"
                }`}
              >
                <Sparkles className="w-4.5 h-4.5 stroke-[2.5]" />
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E8793A] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E8793A]"></span>
                </span>
                <span className="absolute bottom-0 right-1 text-[8px] font-mono font-bold bg-[#1C1512]/90 px-1 rounded text-white/50 group-hover/btn:text-[#E8793A] transition-colors pointer-events-none">
                  S
                </span>
              </button>

              <button
                type="button"
                title="Paint Bucket [F / B] (Flood Fill region)"
                onClick={() => setTool("bucket")}
                className={`p-2.5 rounded-xl transition-all relative cursor-pointer group/btn ${
                  tool === "bucket"
                    ? "bg-[#E8793A] text-neutral-950 font-black scale-110 shadow-lg shadow-[#E8793A]/30"
                    : "text-[#B8ADA3] hover:text-[#F3EDE7] hover:bg-white/[0.05]"
                }`}
              >
                <Paintbrush className="w-4.5 h-4.5 stroke-[2.5]" />
                <span className="absolute bottom-0 right-1 text-[8px] font-mono font-bold bg-[#1C1512]/90 px-1 rounded text-white/50 group-hover/btn:text-[#E8793A] transition-colors pointer-events-none">
                  F
                </span>
              </button>

              <button
                type="button"
                title="Eraser Tool [E] (Clear pixel colors)"
                onClick={() => setTool("eraser")}
                className={`p-2.5 rounded-xl transition-all relative cursor-pointer group/btn ${
                  tool === "eraser"
                    ? "bg-[#E8793A] text-neutral-950 font-black scale-110 shadow-lg shadow-[#E8793A]/30"
                    : "text-[#B8ADA3] hover:text-[#F3EDE7] hover:bg-white/[0.05]"
                }`}
              >
                <Eraser className="w-4.5 h-4.5 stroke-[2.5]" />
                <span className="absolute bottom-0 right-1 text-[8px] font-mono font-bold bg-[#1C1512]/90 px-1 rounded text-white/50 group-hover/btn:text-[#E8793A] transition-colors pointer-events-none">
                  E
                </span>
              </button>
            </div>

            {/* Magnifier Editor Canvas Box */}
            <div className="relative border-4 border-white/10 rounded-2xl overflow-hidden shadow-2xl bg-neutral-950">
              <canvas
                ref={editCanvasRef}
                width={256}
                height={256}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                className={`block shadow-inner bg-neutral-900/40 relative z-10 transition-all ${
                  tool === "hotspot"
                    ? "cursor-crosshair"
                    : tool === "eraser"
                    ? "cursor-alias"
                    : "cursor-cell"
                }`}
              />
              {activeFrame && (
                <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/75 rounded-lg text-[10px] font-mono font-bold text-neutral-400 select-none z-20 border border-white/5 pointer-events-none">
                  {activeFrame.width}x{activeFrame.height}
                </div>
              )}
            </div>
          </div>

          {tool === "hotspot" ? (
            <p className="text-xs text-[#B8ADA3] text-center mb-3 flex items-center gap-1.5 font-medium select-none">
              <Move className="w-3.5 h-3.5 text-[#E8793A]" />
              <span>Click or drag on the canvas to set the cursor's hot clicking pixel.</span>
            </p>
          ) : (
            <p className="text-xs text-[#E8793A] text-center mb-3 flex items-center gap-1.5 font-bold animate-pulse select-none">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {tool === "smart_brush"
                  ? "Smart Brush Active: Drawing with automatic stroke smoothing and anti-aliased curves!"
                  : `Painter Active: Drawing with ${tool} tool.`}
              </span>
            </p>
          )}

          {/* Interactive Precise Hotspot Input UI */}
          {activeFrame && (
            <div className="flex flex-wrap items-center justify-center gap-3 bg-black/45 px-4 py-2 rounded-xl border border-white/5 mb-5 shadow-md backdrop-blur-sm">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#B8ADA3] mr-1">Hotspot Coordinate:</span>
              
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-[#E8793A] font-mono">X:</span>
                <input
                  type="number"
                  min={0}
                  max={activeFrame.width - 1}
                  value={activeFrame.hotspot_x}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(activeFrame.width - 1, parseInt(e.target.value) || 0));
                    onHotspotChanged(val, activeFrame.hotspot_y, applyToAll);
                  }}
                  className="w-14 px-2 py-1 bg-neutral-900/90 border border-white/15 rounded text-center text-xs text-[#F3EDE7] font-mono focus:outline-none focus:border-[#E8793A]"
                />
              </div>

              <div className="w-px h-4 bg-white/15 hidden sm:block"></div>

              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-[#6E5A7B] font-mono">Y:</span>
                <input
                  type="number"
                  min={0}
                  max={activeFrame.height - 1}
                  value={activeFrame.hotspot_y}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(activeFrame.height - 1, parseInt(e.target.value) || 0));
                    onHotspotChanged(activeFrame.hotspot_x, val, applyToAll);
                  }}
                  className="w-14 px-2 py-1 bg-neutral-900/90 border border-white/15 rounded text-center text-xs text-[#F3EDE7] font-mono focus:outline-none focus:border-[#6E5A7B]"
                />
              </div>

              <div className="w-px h-4 bg-white/15"></div>

              {/* Nudge buttons for ultimate 1px precision */}
              <div className="flex space-x-1">
                <button
                  type="button"
                  title="Nudge 1px up"
                  onClick={() => onHotspotChanged(activeFrame.hotspot_x, Math.max(0, activeFrame.hotspot_y - 1), applyToAll)}
                  className="p-1 rounded bg-white/[0.05] hover:bg-white/[0.12] text-white/80 hover:text-white transition-colors text-xs font-bold cursor-pointer h-6 w-6 flex items-center justify-center border border-white/5"
                >
                  ▲
                </button>
                <button
                  type="button"
                  title="Nudge 1px down"
                  onClick={() => onHotspotChanged(activeFrame.hotspot_x, Math.min(activeFrame.height - 1, activeFrame.hotspot_y + 1), applyToAll)}
                  className="p-1 rounded bg-white/[0.05] hover:bg-white/[0.12] text-white/80 hover:text-white transition-colors text-xs font-bold cursor-pointer h-6 w-6 flex items-center justify-center border border-white/5"
                >
                  ▼
                </button>
                <button
                  type="button"
                  title="Nudge 1px left"
                  onClick={() => onHotspotChanged(Math.max(0, activeFrame.hotspot_x - 1), activeFrame.hotspot_y, applyToAll)}
                  className="p-1 rounded bg-white/[0.05] hover:bg-white/[0.12] text-white/80 hover:text-white transition-colors text-xs font-bold cursor-pointer h-6 w-6 flex items-center justify-center border border-white/5"
                >
                  ◀
                </button>
                <button
                  type="button"
                  title="Nudge 1px right"
                  onClick={() => onHotspotChanged(Math.min(activeFrame.width - 1, activeFrame.hotspot_x + 1), activeFrame.hotspot_y, applyToAll)}
                  className="p-1 rounded bg-white/[0.05] hover:bg-white/[0.12] text-white/80 hover:text-white transition-colors text-xs font-bold cursor-pointer h-6 w-6 flex items-center justify-center border border-white/5"
                >
                  ▶
                </button>
              </div>
            </div>
          )}

          {/* Hotspot & Onion Skin options */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-[#B8ADA3] hover:text-[#F3EDE7] transition-colors select-none">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="rounded border-white/20 bg-neutral-950 text-[#E8793A] focus:ring-[#E8793A] focus:ring-offset-neutral-900 w-4 h-4 cursor-pointer"
              />
              <span>Apply hotspot to all frames</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-[#B8ADA3] hover:text-[#F3EDE7] transition-colors select-none" title="Displays a faint green preview of the previous frame behind your current workspace">
              <input
                type="checkbox"
                checked={onionSkinPrev}
                onChange={(e) => setOnionSkinPrev(e.target.checked)}
                className="rounded border-white/20 bg-neutral-950 text-[#E8793A] focus:ring-[#E8793A] focus:ring-offset-neutral-900 w-4 h-4 cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block shadow-sm shadow-[#10B981]/40"></span>
                <span>Onion Skin (Prev Frame)</span>
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-[#B8ADA3] hover:text-[#F3EDE7] transition-colors select-none" title="Displays a faint red/pink preview of the next frame behind your current workspace">
              <input
                type="checkbox"
                checked={onionSkinNext}
                onChange={(e) => setOnionSkinNext(e.target.checked)}
                className="rounded border-white/20 bg-neutral-950 text-[#E8793A] focus:ring-[#E8793A] focus:ring-offset-neutral-900 w-4 h-4 cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block shadow-sm shadow-[#EF4444]/40"></span>
                <span>Onion Skin (Next Frame)</span>
              </span>
            </label>
          </div>
        </div>

        {/* Real Size Looping Live Preview Container */}
        <div className="flex flex-col items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/10 relative overflow-hidden text-center">
          <div className="absolute top-4 left-4 flex items-center space-x-2 text-xs font-medium text-[#B8ADA3]">
            <Layers className="w-4 h-4 text-[#6E5A7B]" />
            <span>Live Cursor Loop</span>
          </div>

          {/* Center Canvas */}
          <div className="my-auto flex flex-col items-center justify-center min-h-[140px]">
            <div className="p-3 bg-neutral-950/50 rounded-xl border border-white/5 shadow-inner cursor-crosshair">
              <canvas
                ref={previewCanvasRef}
                onClick={handlePreviewCanvasClick}
                className="block shadow-md transform hover:scale-125 transition-transform cursor-crosshair"
                style={{ width: "48px", height: "48px" }}
                title="Click anywhere on this preview to set the X/Y hotspot precisely"
              />
            </div>
            <p className="text-[10px] font-mono text-[#B8ADA3] mt-3">True Size (1:1)</p>
            <p className="text-[9px] text-[#E8793A] font-medium mt-1 animate-pulse">Interactive: Click to set hotspot</p>
          </div>

          {/* Playback Settings */}
          <div className="w-full space-y-4">
            <div className="h-px bg-white/10 w-full"></div>
            
            <div className="flex justify-between items-center text-xs text-[#B8ADA3]">
              <span className="font-mono">Frame {currentPlaybackIndex + 1}/{frames.length}</span>
              <span className="font-mono">
                {frames[currentPlaybackIndex]?.duration_ms}ms
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar (Glassmorphic) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/10 w-full shadow-lg">
        {/* Playback Controllers */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2.5 rounded-lg bg-[#E8793A] hover:bg-[#F2925C] text-[#1C1512] font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-sm shadow-md shadow-[#E8793A]/10 cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              onActiveFrameChanged(0);
              setCurrentPlaybackIndex(0);
            }}
            className="p-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[#F3EDE7] transition-all hover:scale-105 active:scale-95 border border-white/5 cursor-pointer"
            title="Reset to first frame"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Toggles */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-[#B8ADA3] mr-2">Playback Speed:</span>
          {([0.5, 1, 2] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all border cursor-pointer ${
                speed === s
                  ? "bg-[#6E5A7B] border-[#6E5A7B] text-[#F3EDE7] shadow-md shadow-[#6E5A7B]/20"
                  : "bg-white/[0.02] border-white/10 text-[#B8ADA3] hover:bg-white/[0.05] hover:text-[#F3EDE7]"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Loop Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-[#B8ADA3] mr-2">Playback Loop:</span>
          <button
            onClick={() => setLoop(!loop)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border cursor-pointer ${
              loop
                ? "bg-[#6E5A7B]/40 border-[#6E5A7B]/40 text-[#F3EDE7]"
                : "bg-white/[0.02] border-white/10 text-[#B8ADA3] hover:bg-white/[0.05]"
            }`}
          >
            {loop ? "Infinite Loop" : "Play Once"}
          </button>
        </div>
      </div>
    </div>
  );
};
