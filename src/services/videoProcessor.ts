import { CursorFrame } from "../engine/curParser.ts";

export type BgRemovalMode = "none" | "black" | "white" | "chroma_green" | "chroma_blue" | "custom";

export interface VideoExtractionOptions {
  videoUrl: string;
  startTime?: number; // seconds
  endTime?: number; // seconds
  frameCount?: number; // total frames to extract
  resolution?: number; // width & height in px (e.g. 32, 48, 64)
  frameDurationMs?: number; // duration per frame in ms
  hotspotX?: number;
  hotspotY?: number;
  bgMode?: BgRemovalMode;
  keyColor?: string; // hex format e.g. #00FF00
  keyTolerance?: number; // 0 - 100 percentage
  hueRotate?: number; // 0 - 360 deg
  brightness?: number; // 50 - 200 %
  contrast?: number; // 50 - 200 %
  saturation?: number; // 0 - 200 %
  invert?: boolean;
  neonGlow?: boolean;
  neonColor?: string;
  pixelate?: boolean;
  onProgress?: (progressPercentage: number, currentFrame: number, totalFrames: number) => void;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

/**
 * Loads video metadata (duration, width, height) from a video URL or Object URL.
 */
export async function getVideoMetadata(videoUrl: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "metadata";

    const onLoaded = () => {
      cleanup();
      resolve({
        duration: video.duration || 0,
        width: video.videoWidth || 320,
        height: video.videoHeight || 320,
      });
    };

    const onError = (e: Event) => {
      cleanup();
      reject(new Error("Failed to load video metadata from URL"));
    };

    const cleanup = () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("error", onError);
      video.src = "";
      video.load();
    };

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("error", onError);
    video.src = videoUrl;
  });
}

/**
 * Converts Hex color string to RGB object
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace("#", "");
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return { r: 0, g: 255, b: 0 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Applies pixel-level transparency and color filters to an HTML5 Canvas Context
 */
export function applyCanvasPixelEffects(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opts: {
    bgMode?: BgRemovalMode;
    keyColor?: string;
    keyTolerance?: number;
    invert?: boolean;
    neonGlow?: boolean;
    neonColor?: string;
  }
) {
  const {
    bgMode = "none",
    keyColor = "#00FF00",
    keyTolerance = 35,
    invert = false,
    neonGlow = false,
    neonColor = "#E8793A",
  } = opts;

  if (bgMode === "none" && !invert && !neonGlow) {
    return;
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const targetRgb = hexToRgb(keyColor);
  const tol = (keyTolerance / 100) * 255;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    let makeTransparent = false;

    if (bgMode === "black") {
      const brightnessVal = (r + g + b) / 3;
      if (brightnessVal < tol) {
        makeTransparent = true;
      }
    } else if (bgMode === "white") {
      const brightnessVal = (r + g + b) / 3;
      if (brightnessVal > 255 - tol) {
        makeTransparent = true;
      }
    } else if (bgMode === "chroma_green") {
      if (g > 100 && g > r * 1.2 && g > b * 1.2 && Math.abs(g - 255) < tol + 100) {
        makeTransparent = true;
      }
    } else if (bgMode === "chroma_blue") {
      if (b > 100 && b > r * 1.2 && b > g * 1.2 && Math.abs(b - 255) < tol + 100) {
        makeTransparent = true;
      }
    } else if (bgMode === "custom") {
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
      data[i + 3] = 0;
      continue;
    }

    if (invert) {
      data[i] = 255 - r;
      data[i + 1] = 255 - g;
      data[i + 2] = 255 - b;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  if (neonGlow) {
    const glowRgb = hexToRgb(neonColor);
    ctx.save();
    ctx.shadowColor = `rgba(${glowRgb.r}, ${glowRgb.g}, ${glowRgb.b}, 0.9)`;
    ctx.shadowBlur = Math.max(4, Math.round(width / 6));
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.restore();
  }
}

/**
 * Extracts frames from a video URL using HTML5 Video element and Canvas API.
 */
export async function extractFramesFromVideoUrl(options: VideoExtractionOptions): Promise<CursorFrame[]> {
  const {
    videoUrl,
    startTime = 0,
    endTime,
    frameCount = 16,
    resolution = 32,
    frameDurationMs = 80,
    hotspotX = 0,
    hotspotY = 0,
    bgMode = "none",
    keyColor = "#00FF00",
    keyTolerance = 35,
    hueRotate = 0,
    brightness = 100,
    contrast = 100,
    saturation = 100,
    invert = false,
    neonGlow = false,
    neonColor = "#E8793A",
    pixelate = false,
    onProgress,
  } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;

    video.addEventListener("loadedmetadata", async () => {
      try {
        const vDuration = video.duration || 1;
        const actualEndTime = endTime !== undefined ? Math.min(endTime, vDuration) : Math.min(3, vDuration);
        const actualStartTime = Math.max(0, Math.min(startTime, actualEndTime - 0.05));
        const totalDuration = Math.max(0.1, actualEndTime - actualStartTime);
        const timeStep = totalDuration / Math.max(1, frameCount);

        const canvas = document.createElement("canvas");
        canvas.width = resolution;
        canvas.height = resolution;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (!ctx) {
          reject(new Error("Failed to get 2D canvas context"));
          return;
        }

        const extractedFrames: CursorFrame[] = [];

        for (let i = 0; i < frameCount; i++) {
          const targetTime = actualStartTime + i * timeStep;

          // Seek video to exact frame
          await new Promise<void>((seekResolve) => {
            const onSeeked = () => {
              video.removeEventListener("seeked", onSeeked);
              seekResolve();
            };
            video.addEventListener("seeked", onSeeked);
            video.currentTime = Math.min(targetTime, vDuration - 0.01);
          });

          // Clear canvas
          ctx.clearRect(0, 0, resolution, resolution);

          // Apply video CSS filters
          ctx.filter = `hue-rotate(${hueRotate}deg) brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

          // Center crop video to square aspect ratio
          const vWidth = video.videoWidth || resolution;
          const vHeight = video.videoHeight || resolution;
          const minDim = Math.min(vWidth, vHeight);
          const sx = (vWidth - minDim) / 2;
          const sy = (vHeight - minDim) / 2;

          if (pixelate) {
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = 16;
            tempCanvas.height = 16;
            const tempCtx = tempCanvas.getContext("2d");
            if (tempCtx) {
              tempCtx.filter = ctx.filter;
              tempCtx.drawImage(video, sx, sy, minDim, minDim, 0, 0, 16, 16);
              ctx.filter = "none";
              ctx.imageSmoothingEnabled = false;
              ctx.drawImage(tempCanvas, 0, 0, 16, 16, 0, 0, resolution, resolution);
            }
          } else {
            ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, resolution, resolution);
          }

          ctx.filter = "none";

          // Apply background removal / keying & effects
          applyCanvasPixelEffects(ctx, resolution, resolution, {
            bgMode,
            keyColor,
            keyTolerance,
            invert,
            neonGlow,
            neonColor,
          });

          const imgData = ctx.getImageData(0, 0, resolution, resolution);
          const dataUrl = canvas.toDataURL("image/png");

          extractedFrames.push({
            width: resolution,
            height: resolution,
            hotspotX: Math.min(hotspotX, resolution - 1),
            hotspotY: Math.min(hotspotY, resolution - 1),
            imageData: imgData,
            dataUrl: dataUrl,
            durationMs: frameDurationMs,
          });

          if (onProgress) {
            const progress = Math.round(((i + 1) / frameCount) * 100);
            onProgress(progress, i + 1, frameCount);
          }
        }

        // Cleanup video src
        video.src = "";
        video.load();

        resolve(extractedFrames);
      } catch (err) {
        reject(err);
      }
    });

    video.addEventListener("error", (e) => {
      reject(new Error("Error playing or decoding video file."));
    });

    video.src = videoUrl;
  });
}
