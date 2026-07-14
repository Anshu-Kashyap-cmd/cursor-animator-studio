import { applyEasing, EasingType } from "./easing.ts";

export type EffectPreset =
  | "spin"
  | "pulse"
  | "glow"
  | "bounce"
  | "colorShift"
  | "particleTrail"
  | "shake"
  | "emberFlicker"
  | "rippleRing"
  | "snowFlake"
  | "rainbowTrail"
  | "thunderStrike"
  | "nebulaSwirl"
  | "synthwaveGlow"
  | "rgbGlitch"
  | "fairyDust"
  | "bloodDrip"
  | "beatPulse"
  | "fireAndIce"
  | "fire"
  | "dragon"
  | "laser"
  | "matrixRain"
  | "heartBurst"
  | "goldRing"
  | "snowBlizzard"
  | "chromaWave"
  | "quantumSpark"
  | "retroPortal"
  | "glitchScanner"
  | "cosmicSupernova"
  | "portalVortex"
  | "heartbeat"
  | "plasmaShield"
  | "superSaiyan"
  | "cherryBlossom"
  | "electricSpark"
  | "poisonCloud"
  | "waterSplash"
  | "disintegration"
  | "magmaCore"
  | "goldenHalo"
  | "dnaHelix"
  | "discoParty"
  | "ghostPhantom"
  | "vampireBats"
  | "digitalMatrix"
  | "bubblePop"
  | "blackHole"
  | "butterflyFlight"
  | "magicSpell"
  | "crystalShards"
  | "auroraBorealis"
  | "steampunkGear";

export interface EffectGeneratorConfig {
  frameCount: number;
  effectPreset: EffectPreset;
  easing: EasingType;
  hotspotX: number;
  hotspotY: number;
  seed: number;
  accentColor: string; // Hex, e.g. '#E8793A'
  spinAroundHotspot: boolean;
}

export interface GeneratedFrame {
  width: number;
  height: number;
  hotspotX: number;
  hotspotY: number;
  imageData: ImageData;
  dataUrl: string;
}

/**
 * A simple seeded pseudo-random generator
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Procedurally generates a sequence of animated frames from a single source image/canvas.
 */
export function generateEffectFrames(
  sourceCanvas: HTMLCanvasElement,
  sourceHotspotX: number,
  sourceHotspotY: number,
  config: EffectGeneratorConfig
): GeneratedFrame[] {
  const {
    frameCount,
    effectPreset,
    easing,
    seed,
    accentColor,
    spinAroundHotspot,
  } = config;

  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const generated: GeneratedFrame[] = [];

  for (let i = 0; i < frameCount; i++) {
    const progress = i / frameCount;
    const t = applyEasing(progress, easing);

    // Create an offscreen canvas for this frame
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      continue;
    }

    ctx.clearRect(0, 0, width, height);

    let currentHotspotX = sourceHotspotX;
    let currentHotspotY = sourceHotspotY;

    ctx.save();

    switch (effectPreset) {
      case "spin": {
        // Rotate around center or hotspot with high-quality cinematic motion blur
        const rotX = spinAroundHotspot ? sourceHotspotX : width / 2;
        const rotY = spinAroundHotspot ? sourceHotspotY : height / 2;
        const angle = t * 2 * Math.PI;

        ctx.save();
        const blurSteps = 4;
        for (let b = 0; b < blurSteps; b++) {
          const subAngle = angle - (b * 0.05);
          ctx.save();
          ctx.translate(rotX, rotY);
          ctx.rotate(subAngle);
          ctx.translate(-rotX, -rotY);
          ctx.globalAlpha = 1.0 / (b * 1.5 + 1);
          ctx.drawImage(sourceCanvas, 0, 0);
          ctx.restore();
        }
        ctx.restore();
        break;
      }

      case "pulse": {
        // Scale around the hotspot so click point doesn't drift, with smooth breathing spring physics
        const s = 1 + 0.16 * Math.sin(2 * Math.PI * t);
        ctx.translate(sourceHotspotX, sourceHotspotY);
        ctx.scale(s, s);
        ctx.translate(-sourceHotspotX, -sourceHotspotY);
        ctx.drawImage(sourceCanvas, 0, 0);
        break;
      }

      case "glow": {
        // High-end double-layered glowing neon aura
        const glowAlpha = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(2 * Math.PI * t));
        
        ctx.save();
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 12;
        ctx.globalAlpha = glowAlpha;
        ctx.drawImage(sourceCanvas, 0, 0);
        
        // Secondary outer halo
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 4;
        ctx.globalAlpha = glowAlpha * 0.5;
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.restore();
        
        // Core cursor drawn sharp on top
        ctx.drawImage(sourceCanvas, 0, 0);
        break;
      }

      case "bounce": {
        // Vertical bounce with impact squashing and stretching
        const amplitude = height * 0.22;
        // parabolic bounce curve
        const bounceY = Math.sin(t * Math.PI);
        const offsetY = -amplitude * bounceY;
        const isImpact = t < 0.1 || t > 0.9;

        ctx.save();
        if (isImpact) {
          // Squash when touching down
          ctx.translate(width / 2, height);
          ctx.scale(1.08, 0.92);
          ctx.translate(-width / 2, -height);
        } else {
          // Stretch slightly while flying up/down
          const speedFactor = Math.abs(Math.cos(t * Math.PI)) * 0.05;
          ctx.translate(width / 2, height + offsetY);
          ctx.scale(1 - speedFactor, 1 + speedFactor);
          ctx.translate(-width / 2, -(height + offsetY));
        }

        ctx.drawImage(sourceCanvas, 0, isImpact ? 0 : offsetY);
        ctx.restore();
        
        currentHotspotY = Math.round(sourceHotspotY + (isImpact ? 0 : offsetY));
        break;
      }

      case "colorShift": {
        // Beautiful vibrant multi-stage spectrum shift
        ctx.filter = `hue-rotate(${t * 360}deg) saturate(130%)`;
        ctx.drawImage(sourceCanvas, 0, 0);
        break;
      }

      case "particleTrail": {
        // Core cursor drawn sharp
        ctx.drawImage(sourceCanvas, 0, 0);

        // Fading glowing trailing particles styled like comet dust with trailing speed lines
        ctx.save();
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 6;
        
        for (let p = 1; p <= 5; p++) {
          const pProgress = (t - p * 0.15 + 1.0) % 1.0;
          const pAlpha = (1.0 - pProgress) * 0.85;
          const radius = (1.0 - pProgress) * 3.2 + 0.6;
          
          const pX = sourceHotspotX - pProgress * (width * 0.35) + Math.sin(pProgress * Math.PI * 5 + p) * 3;
          const pY = sourceHotspotY + pProgress * (height * 0.25);

          ctx.fillStyle = accentColor;
          ctx.globalAlpha = pAlpha;
          ctx.beginPath();
          ctx.arc(pX, pY, radius, 0, Math.PI * 2);
          ctx.fill();

          // Tiny speed connector lines
          if (pAlpha > 0.3) {
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 0.5;
            ctx.globalAlpha = pAlpha * 0.4;
            ctx.beginPath();
            ctx.moveTo(pX, pY);
            ctx.lineTo(pX - 4, pY + 1.5);
            ctx.stroke();
          }
        }
        ctx.restore();
        break;
      }

      case "shake": {
        // High-frequency jitter
        const r1 = seededRandom(seed + i * 2);
        const r2 = seededRandom(seed + i * 2 + 1);
        const dx = r1 * 5 - 2.5; 
        const dy = r2 * 5 - 2.5; 

        ctx.drawImage(sourceCanvas, dx, dy);
        currentHotspotX = Math.round(sourceHotspotX + dx);
        currentHotspotY = Math.round(sourceHotspotY + dy);
        break;
      }

      case "emberFlicker": {
        // Core image flickers with ambient fireglow
        ctx.save();
        ctx.globalAlpha = 0.75 + 0.25 * Math.sin(t * Math.PI * 8);
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.restore();

        // High-fidelity sparks with flame tail coiling upwards
        ctx.save();
        ctx.shadowBlur = 5;
        ctx.shadowColor = "#FF3F00";
        for (let k = 0; k < 6; k++) {
          const sparkProgress = (t + k * 0.16) % 1.0;
          const sparkX = sourceHotspotX + Math.sin(sparkProgress * Math.PI * 5 + k) * 6;
          const sparkY = sourceHotspotY - sparkProgress * (height * 0.65);
          const sparkSize = (1.0 - sparkProgress) * 2.8 + 0.4;
          
          // Color shifts orange -> gold -> hot-white
          let col = "#FF3300";
          if (sparkProgress > 0.6) col = "#FFDD33";
          else if (sparkProgress > 0.3) col = "#FFAA00";

          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;
      }

      case "rippleRing": {
        ctx.drawImage(sourceCanvas, 0, 0);
        
        // Multi-layered water wave ripples radiating outwards with subtle thickness fade
        ctx.save();
        ctx.strokeStyle = accentColor || "#38BDF8";
        for (let k = 0; k < 3; k++) {
          const ringT = (t + k * 0.33) % 1.0;
          ctx.lineWidth = (1.0 - ringT) * 2.2 + 0.5;
          ctx.globalAlpha = 1.0 - ringT;
          ctx.beginPath();
          ctx.arc(sourceHotspotX, sourceHotspotY, ringT * (width * 0.65), 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
        break;
      }

      case "snowFlake": {
        ctx.drawImage(sourceCanvas, 0, 0);

        // Intricately-drawn hexagonal falling frost & snowflakes with gentle sway
        ctx.save();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1.1;
        for (let k = 0; k < 4; k++) {
          const flakeT = (t + k * 0.25) % 1.0;
          ctx.globalAlpha = (1.0 - flakeT) * 0.95;
          const fx = sourceHotspotX + Math.sin(flakeT * Math.PI * 3 + k) * 7;
          const fy = sourceHotspotY - 2 + flakeT * (height * 0.65);
          
          ctx.beginPath();
          // Horizontal/Vertical lines
          ctx.moveTo(fx - 3.5, fy); ctx.lineTo(fx + 3.5, fy);
          ctx.moveTo(fx, fy - 3.5); ctx.lineTo(fx, fy + 3.5);
          // Diagonal crosses
          ctx.moveTo(fx - 2.2, fy - 2.2); ctx.lineTo(fx + 2.2, fy + 2.2);
          ctx.moveTo(fx - 2.2, fy + 2.2); ctx.lineTo(fx + 2.2, fy - 2.2);
          ctx.stroke();
        }
        ctx.restore();
        break;
      }

      case "rainbowTrail": {
        ctx.drawImage(sourceCanvas, 0, 0);

        // Elegant flowing rainbow light orbs changing hues continuously
        ctx.save();
        for (let k = 1; k <= 6; k++) {
          const trailT = (t - k * 0.12 + 1.0) % 1.0;
          ctx.globalAlpha = (1.0 - trailT) * 0.9;
          const tx = sourceHotspotX - trailT * (width * 0.38) + Math.sin(trailT * Math.PI * 4 + k) * 3;
          const ty = sourceHotspotY + trailT * (height * 0.22);
          
          ctx.fillStyle = `hsl(${(trailT * 360 + k * 20) % 360}, 100%, 60%)`;
          ctx.shadowBlur = 4;
          ctx.shadowColor = `hsl(${(trailT * 360 + k * 20) % 360}, 100%, 60%)`;
          ctx.beginPath();
          ctx.arc(tx, ty, (1.0 - trailT) * 3.8 + 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;
      }

      case "thunderStrike": {
        // Main flash overlays
        const isFlash = t < 0.15 || (t > 0.45 && t < 0.55);
        if (isFlash) {
          ctx.save();
          ctx.fillStyle = "rgba(0, 240, 255, 0.35)";
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }

        ctx.drawImage(sourceCanvas, 0, 0);

        // Draw crackling main lightning bolt and branches hitting the hotspot
        ctx.save();
        ctx.strokeStyle = "#FFFFFF";
        ctx.shadowColor = "#00FFFF";
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.8;

        const segments = 6;
        let lastX = sourceHotspotX + (seededRandom(seed) * 16 - 8);
        let lastY = 0;

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);

        for (let s = 1; s <= segments; s++) {
          const segY = (s / segments) * sourceHotspotY;
          const wiggle = Math.sin(t * Math.PI * 5 + s) * 5;
          const segX = sourceHotspotX + (seededRandom(seed + s) * 10 - 5) + wiggle;

          ctx.lineTo(segX, segY);

          // Side branches
          if (s === 3 && t < 0.6) {
            ctx.stroke(); 
            ctx.save();
            ctx.lineWidth = 0.8;
            ctx.strokeStyle = "rgba(0, 220, 255, 0.7)";
            ctx.beginPath();
            ctx.moveTo(segX, segY);
            ctx.lineTo(segX - 8, segY + 6);
            ctx.lineTo(segX - 12, segY + 12);
            ctx.stroke();
            ctx.restore();
            ctx.beginPath();
            ctx.moveTo(segX, segY);
          }

          lastX = segX;
          lastY = segY;
        }
        ctx.lineTo(sourceHotspotX, sourceHotspotY);
        ctx.stroke();

        // Spark explosion at ground hotspot
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(sourceHotspotX, sourceHotspotY, 3 + Math.sin(t * Math.PI * 10) * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        break;
      }

      case "nebulaSwirl": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        ctx.shadowColor = "#8A2BE2";
        ctx.shadowBlur = 4;

        // Elegant coiling space debris in dynamic ellipses
        for (let k = 0; k < 6; k++) {
          const rad = (t * 2 * Math.PI) + (k * Math.PI / 3);
          const radiusX = 7 + 3 * Math.sin(t * Math.PI * 2);
          const radiusY = 5 + 2 * Math.cos(t * Math.PI * 2);
          const nx = sourceHotspotX + Math.cos(rad) * radiusX;
          const ny = sourceHotspotY + Math.sin(rad) * radiusY;
          
          ctx.fillStyle = k % 2 === 0 ? "#FF1493" : "#00FFFF";
          ctx.globalAlpha = 0.8;
          ctx.beginPath();
          ctx.arc(nx, ny, 2.0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;
      }

      case "synthwaveGlow": {
        // High quality neon wireframe scanner lines and dual pink-purple aura
        ctx.save();
        ctx.shadowColor = "#FF1493";
        ctx.shadowBlur = 8;
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.restore();
        
        const scanY = t * height;
        ctx.save();
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 1.8;
        ctx.shadowColor = "#00FFFF";
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(width, scanY);
        ctx.stroke();
        ctx.restore();
        break;
      }

      case "rgbGlitch": {
        // Professional scanline cutting and displacement
        const sliceHeight = Math.max(2, Math.round(height / 12));
        for (let y = 0; y < height; y += sliceHeight) {
          const shiftProb = seededRandom(seed + i * 50 + y);
          let shiftX = 0;
          if (shiftProb < 0.35) {
            shiftX = Math.round(seededRandom(seed + i * 80 + y) * 8 - 4);
          }
          
          ctx.drawImage(
            sourceCanvas,
            0, y, width, sliceHeight,
            shiftX, y, width, sliceHeight
          );
          
          if (shiftProb < 0.12) {
            ctx.save();
            ctx.fillStyle = shiftProb < 0.06 ? "rgba(0, 255, 255, 0.4)" : "rgba(255, 20, 147, 0.4)";
            ctx.fillRect(shiftX, y, width, sliceHeight);
            ctx.restore();
          }
        }
        break;
      }

      case "fairyDust": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();

        const drawStar = (cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
          let rot = Math.PI / 2 * 3;
          let x = cx;
          let y = cy;
          let step = Math.PI / spikes;

          ctx.beginPath();
          ctx.moveTo(cx, cy - outerRadius);
          for (let s = 0; s < spikes; s++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
          }
          ctx.lineTo(cx, cy - outerRadius);
          ctx.closePath();
          ctx.fill();
        };

        for (let k = 0; k < 7; k++) {
          const starT = (t + k * 0.14) % 1.0;
          const starAngle = starT * Math.PI * 5 + k;
          const radius = 10 * (1.0 - starT) + 1.5;
          const sx = sourceHotspotX + Math.cos(starAngle) * radius;
          const sy = sourceHotspotY + Math.sin(starAngle) * radius - starT * 8;
          
          let starColor = `hsl(${(t * 360 + k * 45) % 360}, 100%, 75%)`;
          ctx.fillStyle = starColor;
          ctx.shadowColor = starColor;
          ctx.shadowBlur = 5;
          ctx.globalAlpha = 1.0 - starT;

          drawStar(sx, sy, 4, (1.0 - starT) * 3.5 + 1.0, (1.0 - starT) * 1.5 + 0.3);
        }
        ctx.restore();
        break;
      }

      case "bloodDrip": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        ctx.fillStyle = "#D31212";
        ctx.shadowColor = "#4A0000";
        ctx.shadowBlur = 4;

        if (t <= 0.5) {
          const stretch = t * 2; 
          const dripLength = stretch * (height * 0.4);
          
          ctx.beginPath();
          ctx.moveTo(sourceHotspotX - 1.2, sourceHotspotY);
          ctx.quadraticCurveTo(sourceHotspotX - 0.5, sourceHotspotY + dripLength * 0.7, sourceHotspotX - 1.5, sourceHotspotY + dripLength);
          ctx.arc(sourceHotspotX, sourceHotspotY + dripLength, 2.2, Math.PI, 0, true);
          ctx.quadraticCurveTo(sourceHotspotX + 0.5, sourceHotspotY + dripLength * 0.7, sourceHotspotX + 1.2, sourceHotspotY);
          ctx.closePath();
          ctx.fill();
        } else if (t <= 0.8) {
          const fallProgress = (t - 0.5) / 0.3; 
          const startY = sourceHotspotY + (height * 0.4);
          const currentY = startY + fallProgress * (height - startY - 4);

          ctx.beginPath();
          ctx.moveTo(sourceHotspotX, currentY - 3);
          ctx.lineTo(sourceHotspotX - 1.8, currentY + 1);
          ctx.arc(sourceHotspotX, currentY + 1, 1.8, Math.PI, 0, true);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.arc(sourceHotspotX, sourceHotspotY, Math.max(0.5, 1.5 * (1.0 - fallProgress)), 0, Math.PI * 2);
          ctx.fill();
        } else {
          const splatProgress = (t - 0.8) / 0.2; 
          const bY = height - 2;
          
          ctx.globalAlpha = 1.0 - splatProgress;
          ctx.beginPath();
          ctx.ellipse(sourceHotspotX, bY, splatProgress * 6 + 1.5, splatProgress * 2.5 + 0.5, 0, 0, Math.PI * 2);
          ctx.fill();

          for (let d = 0; d < 3; d++) {
            const angle = -Math.PI / 4 - (d * Math.PI / 4);
            const dist = splatProgress * 5;
            ctx.beginPath();
            ctx.arc(sourceHotspotX + Math.cos(angle) * dist, bY + Math.sin(angle) * dist, 0.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
        break;
      }

      case "beatPulse": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        ctx.fillStyle = accentColor || "#E8793A";
        ctx.shadowColor = accentColor || "#E8793A";
        ctx.shadowBlur = 4;
        
        const barCount = 4;
        for (let k = 0; k < barCount; k++) {
          const waveH = Math.abs(Math.sin(t * Math.PI * 4 + k * 1.5)) * (height * 0.35) + 2;
          const xOffset = k * 3;
          ctx.fillRect(2 + xOffset, height - waveH - 2, 2, waveH);
          ctx.fillRect(width - 4 - xOffset, height - waveH - 2, 2, waveH);
        }
        ctx.restore();
        break;
      }

      case "fireAndIce": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        
        // Orange sparks (Fire) on the left coiling up
        for (let k = 0; k < 5; k++) {
          const fireT = (t + k * 0.2) % 1.0;
          const fx = sourceHotspotX - 5 - fireT * (width * 0.22) + Math.sin(fireT * Math.PI * 6) * 3;
          const fy = sourceHotspotY - fireT * (height * 0.45);
          
          ctx.fillStyle = fireT > 0.65 ? "#FFD700" : "#FF5500";
          ctx.shadowColor = "#FF3300";
          ctx.shadowBlur = 5;
          ctx.globalAlpha = (1.0 - fireT) * 0.9;
          
          ctx.beginPath();
          const r = (1 - fireT) * 2.8 + 0.4;
          ctx.arc(fx, fy, r, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Cyan frost crystals (Ice) on the right settling down or floating
        for (let k = 0; k < 5; k++) {
          const iceT = (t + k * 0.2) % 1.0;
          const ix = sourceHotspotX + 5 + iceT * (width * 0.22) - Math.sin(iceT * Math.PI * 6) * 3;
          const iy = sourceHotspotY - 4 + iceT * (height * 0.45);
          
          ctx.fillStyle = "#E0FFFF";
          ctx.shadowColor = "#00FFFF";
          ctx.shadowBlur = 5;
          ctx.globalAlpha = (1.0 - iceT) * 0.9;
          
          ctx.beginPath();
          const size = (1 - iceT) * 3 + 0.5;
          ctx.moveTo(ix, iy - size);
          ctx.lineTo(ix + size * 0.6, iy);
          ctx.lineTo(ix, iy + size);
          ctx.lineTo(ix - size * 0.6, iy);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        break;
      }

      case "fire": {
        ctx.drawImage(sourceCanvas, 0, 0);

        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#FF3300";

        const grad = ctx.createRadialGradient(sourceHotspotX, sourceHotspotY, 1, sourceHotspotX, sourceHotspotY, width * 0.6);
        grad.addColorStop(0, "rgba(255, 69, 0, 0.4)");
        grad.addColorStop(0.5, "rgba(255, 140, 0, 0.15)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sourceHotspotX, sourceHotspotY, width * 0.6, 0, Math.PI * 2);
        ctx.fill();

        const flameCount = 10;
        for (let k = 0; k < flameCount; k++) {
          const fProgress = (t + k / flameCount) % 1.0;
          const fY = sourceHotspotY + 4 - fProgress * (height * 0.7);
          const wiggleX = Math.sin(fProgress * Math.PI * 3 + k) * 5 + Math.cos(t * Math.PI * 2 + k) * 2;
          const fX = sourceHotspotX + wiggleX;

          let color = "#FF3300";
          if (fProgress < 0.15) {
            color = "#00FFFF";
          } else if (fProgress < 0.4) {
            color = "#FFFFFF";
          } else if (fProgress < 0.7) {
            color = "#FFA500";
          } else {
            color = "#FF3300";
          }

          ctx.fillStyle = color;
          ctx.globalAlpha = (1.0 - fProgress) * 0.8;
          ctx.beginPath();
          
          const size = (1.0 - fProgress) * 5.5 + 0.5;
          ctx.moveTo(fX, fY - size);
          ctx.quadraticCurveTo(fX - size * 0.7, fY + size * 0.3, fX - size * 0.5, fY + size * 0.8);
          ctx.arc(fX, fY + size * 0.8, size * 0.5, Math.PI, 0, true);
          ctx.quadraticCurveTo(fX + size * 0.7, fY + size * 0.3, fX, fY - size);
          ctx.closePath();
          ctx.fill();
        }

        for (let k = 0; k < 4; k++) {
          const ep = (t + k * 0.25) % 1.0;
          const ex = sourceHotspotX + Math.sin(ep * Math.PI * 5 + k) * 7;
          const ey = sourceHotspotY - ep * (height * 0.8);
          ctx.fillStyle = "#FFCC00";
          ctx.shadowBlur = 3;
          ctx.shadowColor = "#FFCC00";
          ctx.globalAlpha = 1.0 - ep;
          ctx.beginPath();
          ctx.arc(ex, ey, (1 - ep) * 1.5 + 0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
        break;
      }

      case "dragon": {
        ctx.drawImage(sourceCanvas, 0, 0);

        ctx.save();
        const segments = 16;
        
        ctx.strokeStyle = "rgba(0, 255, 128, 0.15)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let s = 0; s < segments; s++) {
          const bodySegmentT = (t - s * 0.045 + 1.0) % 1.0;
          const angle = bodySegmentT * Math.PI * 4;
          const radius = (12 + 5 * Math.sin(bodySegmentT * Math.PI * 5)) * (1.0 - s * 0.025);
          const dx = sourceHotspotX + Math.cos(angle) * radius;
          const dy = sourceHotspotY + Math.sin(angle) * radius - (1.0 - bodySegmentT) * 3;
          if (s === 0) ctx.moveTo(dx, dy);
          else ctx.lineTo(dx, dy);
        }
        ctx.stroke();

        for (let s = 0; s < segments; s++) {
          const bodySegmentT = (t - s * 0.045 + 1.0) % 1.0;
          const angle = bodySegmentT * Math.PI * 4;
          const radius = (12 + 5 * Math.sin(bodySegmentT * Math.PI * 5)) * (1.0 - s * 0.025);
          
          const dx = sourceHotspotX + Math.cos(angle) * radius;
          const dy = sourceHotspotY + Math.sin(angle) * radius - (1.0 - bodySegmentT) * 3;

          const isHead = s === 0;
          const isTail = s === segments - 1;

          let col = "#00FF66";
          if (isHead) col = "#FFD700"; 
          else if (s % 3 === 1) col = "#00B359"; 
          else if (s % 3 === 2) col = "#80FFDF"; 

          ctx.fillStyle = col;
          ctx.shadowColor = isHead ? "#FFA500" : "#00FFCC";
          ctx.shadowBlur = isHead ? 6 : 4;
          ctx.globalAlpha = (1.0 - s / segments) * 0.95;

          ctx.beginPath();
          const segmentSize = isHead ? 4.8 : (isTail ? 1.2 : Math.max(1.5, 3.8 - s * 0.18));
          ctx.arc(dx, dy, segmentSize, 0, Math.PI * 2);
          ctx.fill();

          if (s > 0 && s < segments - 2 && s % 2 === 0) {
            ctx.fillStyle = "#FFCC00";
            ctx.beginPath();
            ctx.arc(dx + Math.sin(angle) * 1.5, dy - Math.cos(angle) * 1.5, segmentSize * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }

          if (isHead) {
            ctx.fillStyle = "#FF0000";
            ctx.beginPath();
            ctx.arc(dx - 1.5, dy - 1.2, 0.9, 0, Math.PI * 2);
            ctx.arc(dx + 1.5, dy - 1.2, 0.9, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#FFD700";
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(dx - 1, dy + 1);
            ctx.lineTo(dx - 5, dy + 3);
            ctx.moveTo(dx + 1, dy + 1);
            ctx.lineTo(dx + 5, dy + 3);
            ctx.stroke();
          }
        }
        ctx.restore();
        break;
      }

      case "laser": {
        ctx.drawImage(sourceCanvas, 0, 0);

        ctx.save();
        const laserAngle = -Math.PI / 4; 
        const length = Math.max(width, height) * 1.3;
        const targetX = sourceHotspotX + Math.cos(laserAngle) * length;
        const targetY = sourceHotspotY + Math.sin(laserAngle) * length;

        const activeT = t;
        const isCharging = activeT < 0.25;
        const chargeScale = isCharging ? (activeT / 0.25) : 1.0;

        ctx.strokeStyle = "#FF0077";
        ctx.shadowColor = "#FF0077";
        ctx.shadowBlur = 12;
        ctx.lineWidth = chargeScale * (4.5 + Math.sin(t * Math.PI * 12) * 1.5);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(sourceHotspotX, sourceHotspotY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        ctx.strokeStyle = "#FFFFFF";
        ctx.shadowColor = "#00FFFF";
        ctx.shadowBlur = 4;
        ctx.lineWidth = chargeScale * (1.8 + Math.sin(t * Math.PI * 8) * 0.5);
        ctx.beginPath();
        ctx.moveTo(sourceHotspotX, sourceHotspotY);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        const flareSize = chargeScale * (6 + Math.sin(t * Math.PI * 16) * 3);
        const gradFlare = ctx.createRadialGradient(sourceHotspotX, sourceHotspotY, 1, sourceHotspotX, sourceHotspotY, flareSize);
        gradFlare.addColorStop(0, "#FFFFFF");
        gradFlare.addColorStop(0.3, "rgba(0, 255, 255, 0.8)");
        gradFlare.addColorStop(1, "rgba(255, 0, 119, 0)");
        ctx.fillStyle = gradFlare;
        ctx.beginPath();
        ctx.arc(sourceHotspotX, sourceHotspotY, flareSize, 0, Math.PI * 2);
        ctx.fill();

        const sparkCount = 6;
        ctx.fillStyle = "#FFFF99";
        ctx.shadowBlur = 3;
        ctx.shadowColor = "#FFFF99";
        for (let k = 0; k < sparkCount; k++) {
          const sparkT = (t + k / sparkCount) % 1.0;
          const deviation = (seededRandom(seed + k + i) * 0.4 - 0.2);
          const sAngle = laserAngle + deviation;
          const sDist = sparkT * length * 0.8;
          const sX = sourceHotspotX + Math.cos(sAngle) * sDist;
          const sY = sourceHotspotY + Math.sin(sAngle) * sDist;
          
          ctx.globalAlpha = (1.0 - sparkT) * 0.9;
          ctx.beginPath();
          ctx.arc(sX, sY, (1.0 - sparkT) * 1.8 + 0.3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
        break;
      }

      case "matrixRain": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        ctx.fillStyle = "#00FF00";
        ctx.shadowColor = "#00FF00";
        ctx.shadowBlur = 4;
        const fontHeight = 5;
        ctx.font = `bold ${fontHeight}px monospace`;
        const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$#@%&";
        for (let col = 0; col < 3; col++) {
          const xOffset = (col - 1) * 8;
          const startX = sourceHotspotX + xOffset;
          const rSeed = seededRandom(seed + col);
          for (let j = 0; j < 4; j++) {
            const charT = (t * 1.5 + j * 0.25 + rSeed) % 1.0;
            const charY = sourceHotspotY - 12 + charT * 24;
            const charIdx = Math.floor(seededRandom(seed + col + j + i) * characters.length);
            const char = characters[charIdx];
            ctx.globalAlpha = (1.0 - charT) * 0.9;
            ctx.fillText(char, startX - 1.5, charY);
          }
        }
        ctx.restore();
        break;
      }

      case "heartBurst": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        ctx.fillStyle = "#FF2E93";
        ctx.shadowColor = "#FF2E93";
        ctx.shadowBlur = 5;
        for (let p = 0; p < 4; p++) {
          const prg = (t + p * 0.25) % 1.0;
          const angleRad = (p * Math.PI / 2) + Math.sin(t * Math.PI * 2) * 0.3;
          const dist = prg * 14;
          const hX = sourceHotspotX + Math.cos(angleRad) * dist;
          const hY = sourceHotspotY - prg * 10;
          const size = (1.0 - prg) * 3 + 0.5;

          ctx.globalAlpha = (1.0 - prg) * 0.85;
          ctx.beginPath();
          ctx.arc(hX - size/2, hY, size/2, Math.PI, 0, false);
          ctx.arc(hX + size/2, hY, size/2, Math.PI, 0, false);
          ctx.lineTo(hX, hY + size);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        break;
      }

      case "goldRing": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        ctx.strokeStyle = "#FFD700";
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 6;
        ctx.lineWidth = 1.0;
        const ringCount = 2;
        for (let r = 0; r < ringCount; r++) {
          const prg = (t + r * 0.5) % 1.0;
          ctx.globalAlpha = (1.0 - prg) * 0.9;
          ctx.beginPath();
          ctx.ellipse(sourceHotspotX, sourceHotspotY, prg * 15, prg * 7, Math.PI / 6, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "#FFFFFF";
          const sparkleCount = 4;
          for (let s = 0; s < sparkleCount; s++) {
            const sAngle = (s * Math.PI / 2) + t * Math.PI * 2;
            const sx = sourceHotspotX + Math.cos(sAngle) * prg * 15;
            const sy = sourceHotspotY + Math.sin(sAngle) * prg * 7;
            ctx.globalAlpha = (1.0 - prg) * 0.95;
            ctx.beginPath();
            ctx.arc(sx, sy, 0.9, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
        break;
      }

      case "snowBlizzard": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowColor = "#FFFFFF";
        ctx.shadowBlur = 3;
        for (let s = 0; s < 6; s++) {
          const prg = (t + s * 0.17) % 1.0;
          ctx.globalAlpha = (1.0 - prg) * 0.85;
          const driftX = Math.sin(prg * Math.PI * 2) * 4 - prg * 10;
          const sx = sourceHotspotX + 12 + driftX;
          const sy = sourceHotspotY - 12 + prg * 24;
          ctx.beginPath();
          ctx.arc(sx, sy, (1.0 - prg) * 1.8 + 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;
      }

      case "chromaWave": {
        ctx.save();
        ctx.filter = `hue-rotate(${t * 360}deg)`;
        ctx.drawImage(sourceCanvas, 0, 0);
        
        const grad = ctx.createRadialGradient(sourceHotspotX, sourceHotspotY, 2, sourceHotspotX, sourceHotspotY, 14);
        grad.addColorStop(0, `hsla(${t * 360}, 100%, 50%, 0.45)`);
        grad.addColorStop(0.5, `hsla(${(t * 360 + 120) % 360}, 100%, 50%, 0.2)`);
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grad;
        ctx.globalCompositeOperation = "destination-over";
        ctx.beginPath();
        ctx.arc(sourceHotspotX, sourceHotspotY, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
      }

      case "quantumSpark": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        ctx.fillStyle = "#00FFFF";
        ctx.strokeStyle = "rgba(0, 255, 255, 0.25)";
        ctx.lineWidth = 0.5;
        
        const orbits = 3;
        for (let o = 0; o < orbits; o++) {
          const angleOffset = (o * Math.PI) / 3;
          ctx.beginPath();
          ctx.ellipse(sourceHotspotX, sourceHotspotY, 10, 3, angleOffset, 0, Math.PI * 2);
          ctx.stroke();

          const particleT = t * Math.PI * 2 + (o * Math.PI * 2) / orbits;
          const px = sourceHotspotX + Math.cos(particleT) * 10 * Math.cos(angleOffset) - Math.sin(particleT) * 3 * Math.sin(angleOffset);
          const py = sourceHotspotY + Math.cos(particleT) * 10 * Math.sin(angleOffset) + Math.sin(particleT) * 3 * Math.cos(angleOffset);
          
          ctx.fillStyle = o === 0 ? "#FF00FF" : o === 1 ? "#00FFFF" : "#FFFF00";
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(px, py, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;
      }

      case "retroPortal": {
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        const ringRadius = 4 + 8 * t;
        const pColor = `hsl(${(t * 360) % 360}, 90%, 60%)`;
        ctx.strokeStyle = pColor;
        ctx.shadowColor = pColor;
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.8;
        
        ctx.beginPath();
        ctx.arc(sourceHotspotX, sourceHotspotY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.arc(sourceHotspotX, sourceHotspotY, ringRadius - 1.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.drawImage(sourceCanvas, 0, 0);
        break;
      }

      case "glitchScanner": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        const scanY = t * height;
        ctx.strokeStyle = "#00FF66";
        ctx.shadowColor = "#00FF66";
        ctx.shadowBlur = 6;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(width, scanY);
        ctx.stroke();

        try {
          const sliceHeight = 4;
          const shift = Math.sin(t * Math.PI * 4) * 3;
          if (scanY > 4 && scanY < height - 4) {
            ctx.drawImage(
              sourceCanvas,
              0, Math.floor(scanY - sliceHeight / 2), width, sliceHeight,
              shift, Math.floor(scanY - sliceHeight / 2), width, sliceHeight
            );
          }
        } catch (e) {}
        ctx.restore();
        break;
      }

      case "cosmicSupernova": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const waveRadius = t * 16 + 2;
        const grad = ctx.createRadialGradient(sourceHotspotX, sourceHotspotY, 1, sourceHotspotX, sourceHotspotY, waveRadius);
        grad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        grad.addColorStop(0.3, "rgba(255, 110, 0, 0.7)");
        grad.addColorStop(0.7, "rgba(180, 0, 255, 0.4)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sourceHotspotX, sourceHotspotY, waveRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 180, 50, 0.6)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (let a = 0; a < 8; a++) {
          const angle = (a * Math.PI) / 4 + t * 0.5;
          const length = 5 + t * 12;
          ctx.moveTo(sourceHotspotX, sourceHotspotY);
          ctx.lineTo(sourceHotspotX + Math.cos(angle) * length, sourceHotspotY + Math.sin(angle) * length);
        }
        ctx.stroke();
        ctx.restore();
        break;
      }

      case "portalVortex": {
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.translate(sourceHotspotX, sourceHotspotY);
        ctx.rotate(-t * Math.PI * 4);
        
        const vortexArms = 4;
        ctx.lineWidth = 1.0;
        for (let arm = 0; arm < vortexArms; arm++) {
          const baseAngle = (arm * Math.PI * 2) / vortexArms;
          ctx.strokeStyle = `hsla(${(t * 360 + arm * 90) % 360}, 95%, 65%, 0.85)`;
          ctx.shadowColor = ctx.strokeStyle;
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          for (let r = 0; r < 14; r++) {
            const theta = r * 0.25;
            const x = r * Math.cos(baseAngle + theta);
            const y = r * Math.sin(baseAngle + theta);
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.restore();
        ctx.drawImage(sourceCanvas, 0, 0);
        break;
      }

      case "heartbeat": {
        const beatT = t * Math.PI * 2;
        const pulse = Math.pow(Math.max(0, Math.sin(beatT) + 0.2 * Math.sin(beatT * 2)), 4);
        const s = 1.0 + 0.18 * pulse;

        ctx.save();
        ctx.shadowColor = "#EF4444";
        ctx.shadowBlur = 4 + 12 * pulse;
        ctx.translate(sourceHotspotX, sourceHotspotY);
        ctx.scale(s, s);
        ctx.translate(-sourceHotspotX, -sourceHotspotY);
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.restore();
        break;
      }

      case "plasmaShield": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        const shieldRadius = Math.min(width, height) / 2.2 + 2 * Math.sin(t * Math.PI * 2);
        
        const grad = ctx.createRadialGradient(sourceHotspotX, sourceHotspotY, shieldRadius - 4, sourceHotspotX, sourceHotspotY, shieldRadius + 2);
        grad.addColorStop(0, "rgba(99, 102, 241, 0)");
        grad.addColorStop(0.7, "rgba(168, 85, 247, 0.25)");
        grad.addColorStop(0.95, "rgba(59, 130, 246, 0.7)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sourceHotspotX, sourceHotspotY, shieldRadius + 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(147, 197, 253, 0.8)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.arc(sourceHotspotX, sourceHotspotY, shieldRadius, t * Math.PI * 2, t * Math.PI * 2 + Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        break;
      }

      case "superSaiyan": {
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        for (let j = 0; j < 8; j++) {
          const flareSeed = seed + j * 17;
          const r1 = seededRandom(flareSeed);
          const r2 = seededRandom(flareSeed + 5);
          
          const progressY = (t + r1) % 1;
          const flareX = sourceHotspotX + (r2 - 0.5) * width * 0.9;
          const flareY = height - progressY * height;
          const size = (1 - progressY) * 7 + 1.5;

          ctx.shadowColor = "#FBBF24";
          ctx.shadowBlur = 6;
          const grad = ctx.createRadialGradient(flareX, flareY, 0, flareX, flareY, size);
          grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
          grad.addColorStop(0.3, "rgba(245, 158, 11, 0.75)");
          grad.addColorStop(0.7, "rgba(220, 38, 38, 0.3)");
          grad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(flareX, flareY, size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        ctx.drawImage(sourceCanvas, 0, 0);
        break;
      }

      case "cherryBlossom": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        for (let j = 0; j < 6; j++) {
          const petalSeed = seed + j * 23;
          const r1 = seededRandom(petalSeed);
          const r2 = seededRandom(petalSeed + 7);
          
          const fall = (t + r1) % 1;
          const px = sourceHotspotX + Math.sin(fall * Math.PI * 2 + r2 * 5) * 10;
          const py = sourceHotspotY - 10 + fall * (height + 20);
          const angle = fall * Math.PI * 4 + r2 * Math.PI;

          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(angle);
          ctx.fillStyle = "rgba(244, 143, 177, 0.9)";
          ctx.strokeStyle = "rgba(240, 98, 146, 0.5)";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.ellipse(0, 0, 3, 1.8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
        break;
      }

      case "electricSpark": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        const numArcs = 2 + Math.floor(seededRandom(seed + t * 99) * 3);
        ctx.strokeStyle = "rgba(103, 232, 249, 0.95)";
        ctx.shadowColor = "#22D3EE";
        ctx.shadowBlur = 5;
        ctx.lineWidth = 1;

        for (let a = 0; a < numArcs; a++) {
          const arcSeed = seed + a * 31 + Math.floor(t * 8);
          const targetAngle = seededRandom(arcSeed) * Math.PI * 2;
          const radius = 8 + seededRandom(arcSeed + 3) * 12;
          const targetX = sourceHotspotX + Math.cos(targetAngle) * radius;
          const targetY = sourceHotspotY + Math.sin(targetAngle) * radius;

          ctx.beginPath();
          ctx.moveTo(sourceHotspotX, sourceHotspotY);
          
          const midX = (sourceHotspotX + targetX) / 2 + (seededRandom(arcSeed + 9) - 0.5) * 6;
          const midY = (sourceHotspotY + targetY) / 2 + (seededRandom(arcSeed + 13) - 0.5) * 6;
          
          ctx.lineTo(midX, midY);
          ctx.lineTo(targetX, targetY);
          ctx.stroke();
        }
        ctx.restore();
        break;
      }

      case "poisonCloud": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        for (let j = 0; j < 8; j++) {
          const cloudSeed = seed + j * 13;
          const r1 = seededRandom(cloudSeed);
          const r2 = seededRandom(cloudSeed + 11);
          
          const age = (t + r1) % 1;
          const bubbleAngle = r2 * Math.PI * 2;
          const travel = age * 12;
          const cx = sourceHotspotX + Math.cos(bubbleAngle) * travel;
          const cy = sourceHotspotY + Math.sin(bubbleAngle) * travel - age * 3;
          const r = (1 - age) * 4.5;

          ctx.fillStyle = `rgba(34, 197, 94, ${(1 - age) * 0.75})`;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();

          if (r > 1.5) {
            ctx.fillStyle = "rgba(220, 252, 231, 0.4)";
            ctx.beginPath();
            ctx.arc(cx - r/3, cy - r/3, r/4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
        break;
      }

      case "waterSplash": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        for (let j = 0; j < 10; j++) {
          const dropSeed = seed + j * 47;
          const angle = seededRandom(dropSeed) * Math.PI * 1.5 + Math.PI * 1.75;
          const speed = 4 + seededRandom(dropSeed + 3) * 8;
          
          const time = t;
          const startX = sourceHotspotX;
          const startY = sourceHotspotY;
          
          const dx = startX + Math.cos(angle) * speed * time * 2;
          const dy = startY + Math.sin(angle) * speed * time * 2 + 16 * time * time;

          ctx.fillStyle = "rgba(56, 189, 248, 0.85)";
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(dx, dy, Math.max(0.5, (1 - time) * 2), 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
        break;
      }

      case "disintegration": {
        ctx.save();
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.restore();

        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        for (let j = 0; j < 12; j++) {
          const partSeed = seed + j * 19;
          const rx = seededRandom(partSeed) * width;
          const ry = seededRandom(partSeed + 1) * height;
          
          const progressX = (t + seededRandom(partSeed + 2)) % 1;
          const dx = rx + progressX * 12;
          const dy = ry - progressX * 8;

          ctx.fillStyle = "rgba(232, 121, 58, " + (1 - progressX) + ")";
          ctx.fillRect(dx, dy, 1.5, 1.5);
        }
        ctx.restore();
        break;
      }

      case "magmaCore": {
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.shadowColor = "#EF4444";
        ctx.shadowBlur = 8;
        
        const grad = ctx.createRadialGradient(sourceHotspotX, sourceHotspotY, 1, sourceHotspotX, sourceHotspotY, width / 2);
        grad.addColorStop(0, "rgba(249, 115, 22, 0.4)");
        grad.addColorStop(0.5, "rgba(239, 68, 68, 0.2)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sourceHotspotX, sourceHotspotY, width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        for (let j = 0; j < 6; j++) {
          const emberSeed = seed + j * 41;
          const ex = (seededRandom(emberSeed) * width + t * 4) % width;
          const ey = (height - (t + seededRandom(emberSeed + 3)) % 1 * height);
          ctx.fillStyle = "#F97316";
          ctx.beginPath();
          ctx.arc(ex, ey, 1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        ctx.drawImage(sourceCanvas, 0, 0);
        break;
      }

      case "goldenHalo": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        const hY = Math.max(0, sourceHotspotY - 8);
        const ringRadiusX = 9;
        const ringRadiusY = 2.5;

        ctx.strokeStyle = "#FBBF24";
        ctx.shadowColor = "#FBBF24";
        ctx.shadowBlur = 6;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.ellipse(sourceHotspotX, hY, ringRadiusX, ringRadiusY, Math.PI / 12 * Math.sin(t * Math.PI * 2), 0, Math.PI * 2);
        ctx.stroke();

        const orbAngle = t * Math.PI * 2;
        const sparkX = sourceHotspotX + Math.cos(orbAngle) * ringRadiusX;
        const sparkY = hY + Math.sin(orbAngle) * ringRadiusY;
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
      }

      case "dnaHelix": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        
        const helixLength = height * 0.8;
        const startY = sourceHotspotY - helixLength / 2;
        ctx.lineWidth = 1;

        for (let j = 0; j < 10; j++) {
          const progressY = j / 10;
          const py = startY + progressY * helixLength;
          if (py < 0 || py > height) continue;

          const theta = progressY * Math.PI * 3 + t * Math.PI * 2;
          const xOffset = Math.sin(theta) * 7;

          ctx.fillStyle = "#22D3EE";
          ctx.beginPath();
          ctx.arc(sourceHotspotX + xOffset, py, 1.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#EC4899";
          ctx.beginPath();
          ctx.arc(sourceHotspotX - xOffset, py, 1.2, 0, Math.PI * 2);
          ctx.fill();

          if (j % 2 === 0) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
            ctx.beginPath();
            ctx.moveTo(sourceHotspotX - xOffset, py);
            ctx.lineTo(sourceHotspotX + xOffset, py);
            ctx.stroke();
          }
        }
        ctx.restore();
        break;
      }

      case "discoParty": {
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        for (let r = 0; r < 6; r++) {
          const rayAngle = (r * Math.PI / 3) + t * Math.PI * 2;
          const rayGrad = ctx.createLinearGradient(sourceHotspotX, sourceHotspotY, sourceHotspotX + Math.cos(rayAngle) * width, sourceHotspotY + Math.sin(rayAngle) * height);
          rayGrad.addColorStop(0, `hsla(${(r * 60 + t * 360) % 360}, 100%, 60%, 0.65)`);
          rayGrad.addColorStop(1, "rgba(0,0,0,0)");
          
          ctx.fillStyle = rayGrad;
          ctx.beginPath();
          ctx.moveTo(sourceHotspotX, sourceHotspotY);
          ctx.arc(sourceHotspotX, sourceHotspotY, Math.max(width, height) * 1.5, rayAngle - 0.2, rayAngle + 0.2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        ctx.drawImage(sourceCanvas, 0, 0);
        break;
      }

      case "ghostPhantom": {
        ctx.save();
        const ghosts = 3;
        for (let g = ghosts; g >= 1; g--) {
          const ghostAlpha = (1.0 - g / (ghosts + 1)) * 0.4;
          const offsetT = t - g * 0.08;
          const clT = offsetT < 0 ? offsetT + 1 : offsetT;
          
          ctx.save();
          ctx.globalAlpha = ghostAlpha;
          ctx.translate(-g * 2.5, g * 1.5);
          ctx.drawImage(sourceCanvas, 0, 0);
          ctx.restore();
        }
        ctx.restore();
        ctx.drawImage(sourceCanvas, 0, 0);
        break;
      }

      case "vampireBats": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        for (let j = 0; j < 4; j++) {
          const batSeed = seed + j * 53;
          const r1 = seededRandom(batSeed);
          const r2 = seededRandom(batSeed + 9);
          
          const age = (t + r1) % 1;
          const travelRadius = age * 16;
          const batAngle = r2 * Math.PI * 2;
          const bx = sourceHotspotX + Math.cos(batAngle) * travelRadius;
          const by = sourceHotspotY + Math.sin(batAngle) * travelRadius - age * 4;
          
          const flap = Math.sin(t * Math.PI * 6 + j) > 0;

          ctx.save();
          ctx.translate(bx, by);
          ctx.fillStyle = "#1E1B4B";
          ctx.beginPath();
          if (flap) {
            ctx.moveTo(0, 0);
            ctx.lineTo(-3, -2.5);
            ctx.lineTo(-1, 0);
            ctx.lineTo(0, 1.5);
            ctx.lineTo(1, 0);
            ctx.lineTo(3, -2.5);
          } else {
            ctx.moveTo(0, 0);
            ctx.lineTo(-3.5, 1);
            ctx.lineTo(-1, 0.5);
            ctx.lineTo(0, 2);
            ctx.lineTo(1, 0.5);
            ctx.lineTo(3.5, 1);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
        break;
      }

      case "digitalMatrix": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "#10B981";
        ctx.font = "bold 5px monospace";
        for (let c = 0; c < 5; c++) {
          const colSeed = seed + c * 19;
          const rx = Math.floor(seededRandom(colSeed) * width);
          const rSpeed = 8 + seededRandom(colSeed + 4) * 12;
          const ry = (t * rSpeed + seededRandom(colSeed + 11) * height) % height;
          const char = Math.sin(t * 20 + c) > 0 ? "1" : "0";

          ctx.fillText(char, rx, ry);
        }
        ctx.restore();
        break;
      }

      case "bubblePop": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        for (let j = 0; j < 5; j++) {
          const bubSeed = seed + j * 71;
          const r1 = seededRandom(bubSeed);
          const r2 = seededRandom(bubSeed + 13);
          
          const age = (t + r1) % 1;
          const bx = sourceHotspotX + (r2 - 0.5) * 16;
          const by = sourceHotspotY - age * height * 0.7;
          const radius = age * 3.5 + 0.5;

          ctx.strokeStyle = "rgba(186, 230, 253, 0.7)";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          if (age < 0.85) {
            ctx.arc(bx, by, radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
            ctx.beginPath();
            ctx.arc(bx - radius/3, by - radius/3, radius/4, 0, Math.PI * 2);
            ctx.fill();
          } else {
            for (let p = 0; p < 4; p++) {
              const pAngle = p * Math.PI / 2;
              const px = bx + Math.cos(pAngle) * (radius + 1.5 * (age - 0.85) * 10);
              const py = by + Math.sin(pAngle) * (radius + 1.5 * (age - 0.85) * 10);
              ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
              ctx.fillRect(px, py, 0.7, 0.7);
            }
          }
        }
        ctx.restore();
        break;
      }

      case "blackHole": {
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.translate(sourceHotspotX, sourceHotspotY);
        ctx.rotate(-t * Math.PI * 4);
        
        const spiralLoops = 3;
        ctx.lineWidth = 1.2;
        for (let loop = 0; loop < spiralLoops; loop++) {
          ctx.strokeStyle = `rgba(139, 92, 246, ${0.4 + 0.4 * Math.sin(t * Math.PI)})`;
          ctx.shadowColor = "#3B82F6";
          ctx.shadowBlur = 5;
          ctx.beginPath();
          for (let th = 0; th < 25; th++) {
            const angle = th * 0.25 + (loop * Math.PI * 2 / spiralLoops);
            const r = (25 - th) * 0.6;
            ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
          }
          ctx.stroke();
        }
        ctx.restore();
        ctx.drawImage(sourceCanvas, 0, 0);
        break;
      }

      case "butterflyFlight": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        for (let j = 0; j < 3; j++) {
          const flySeed = seed + j * 97;
          const r1 = seededRandom(flySeed);
          
          const orbitT = t * Math.PI * 2 + r1 * 10;
          const bRadius = 6 + 4 * Math.sin(orbitT);
          const bx = sourceHotspotX + Math.cos(orbitT) * bRadius;
          const by = sourceHotspotY + Math.sin(orbitT) * bRadius - Math.cos(orbitT * 2) * 2;
          
          const wingFlap = Math.sin(t * Math.PI * 14 + j) * 3;

          ctx.save();
          ctx.translate(bx, by);
          ctx.rotate(orbitT + Math.PI/2);
          
          ctx.fillStyle = `hsla(${(j * 120 + t * 360) % 360}, 95%, 65%, 0.9)`;
          ctx.beginPath();
          ctx.ellipse(-2, 0, Math.abs(wingFlap), 2.5, Math.PI/4, 0, Math.PI * 2);
          ctx.ellipse(2, 0, Math.abs(wingFlap), 2.5, -Math.PI/4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#0F172A";
          ctx.fillRect(-0.4, -1.5, 0.8, 3);
          ctx.restore();
        }
        ctx.restore();
        break;
      }

      case "magicSpell": {
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.translate(sourceHotspotX, sourceHotspotY);
        ctx.rotate(t * Math.PI * 1.5);
        
        ctx.strokeStyle = "rgba(168, 85, 247, 0.75)";
        ctx.shadowColor = "#C084FC";
        ctx.shadowBlur = 6;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        for (let v = 0; v < 3; v++) {
          const vAngle = (v * Math.PI * 2) / 3;
          ctx.lineTo(11 * Math.cos(vAngle), 11 * Math.sin(vAngle));
        }
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = "#F3EDE7";
        for (let k = 0; k < 6; k++) {
          const kAngle = (k * Math.PI) / 3;
          ctx.fillRect(8 * Math.cos(kAngle) - 0.7, 8 * Math.sin(kAngle) - 0.7, 1.4, 1.4);
        }
        ctx.restore();
        ctx.drawImage(sourceCanvas, 0, 0);
        break;
      }

      case "crystalShards": {
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        for (let j = 0; j < 5; j++) {
          const shardSeed = seed + j * 83;
          const r1 = seededRandom(shardSeed);
          const angle = r1 * Math.PI * 2;
          const range = 3 + (t * 11);
          
          const sx = sourceHotspotX + Math.cos(angle) * range;
          const sy = sourceHotspotY + Math.sin(angle) * range;
          const shardAngle = t * Math.PI * 3 + r1;

          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(shardAngle);
          
          ctx.fillStyle = `hsla(${(t * 360 + j * 72) % 360}, 90%, 75%, ${1 - t})`;
          ctx.strokeStyle = "rgba(255, 255, 255, " + (1 - t) + ")";
          ctx.lineWidth = 0.5;

          ctx.beginPath();
          ctx.moveTo(0, -3.5);
          ctx.lineTo(1.8, 0);
          ctx.lineTo(0, 3.5);
          ctx.lineTo(-1.8, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
        break;
      }

      case "auroraBorealis": {
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        for (let l = 0; l < 3; l++) {
          const aurSeed = seed + l * 29;
          const offset = l * 4;
          const aurHue = 120 + l * 40;
          
          ctx.strokeStyle = `hsla(${aurHue}, 100%, 55%, 0.35)`;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          for (let x = 0; x <= width; x += 4) {
            const waveY = (height / 2) + Math.sin(x * 0.15 + t * Math.PI * 2 + offset) * 3;
            if (x === 0) ctx.moveTo(x, waveY);
            else ctx.lineTo(x, waveY);
          }
          ctx.stroke();
        }
        ctx.restore();
        ctx.drawImage(sourceCanvas, 0, 0);
        break;
      }

      case "steampunkGear": {
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.translate(sourceHotspotX, sourceHotspotY);
        ctx.rotate(t * Math.PI * 2);
        
        ctx.fillStyle = "#B45309";
        ctx.strokeStyle = "#78350F";
        ctx.lineWidth = 0.8;

        const gearRadius = 10;
        const numTeeth = 8;
        
        ctx.beginPath();
        for (let tooth = 0; tooth < numTeeth; tooth++) {
          const angle = (tooth * Math.PI * 2) / numTeeth;
          const nextAngle = ((tooth + 0.5) * Math.PI * 2) / numTeeth;
          const edgeAngle = ((tooth + 1) * Math.PI * 2) / numTeeth;

          ctx.lineTo(gearRadius * Math.cos(angle), gearRadius * Math.sin(angle));
          ctx.lineTo((gearRadius + 2.5) * Math.cos(angle + 0.1), (gearRadius + 2.5) * Math.sin(angle + 0.1));
          ctx.lineTo((gearRadius + 2.5) * Math.cos(nextAngle - 0.1), (gearRadius + 2.5) * Math.sin(nextAngle - 0.1));
          ctx.lineTo(gearRadius * Math.cos(nextAngle), gearRadius * Math.sin(nextAngle));
          ctx.lineTo(gearRadius * Math.cos(edgeAngle), gearRadius * Math.sin(edgeAngle));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#1C1512";
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.drawImage(sourceCanvas, 0, 0);
        break;
      }

      default:
        ctx.drawImage(sourceCanvas, 0, 0);
        break;
    }

    ctx.restore();

    const imageData = ctx.getImageData(0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/png");

    generated.push({
      width,
      height,
      hotspotX: Math.max(0, Math.min(width - 1, currentHotspotX)),
      hotspotY: Math.max(0, Math.min(height - 1, currentHotspotY)),
      imageData,
      dataUrl,
    });
  }

  return generated;
}
