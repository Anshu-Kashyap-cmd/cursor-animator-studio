import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Sliders, PlayCircle, Heart } from "lucide-react";
import { EffectPreset } from "../engine/effects/index.ts";
import { EasingType } from "../engine/effects/easing.ts";

interface EffectGalleryProps {
  selectedPreset: EffectPreset;
  onPresetSelected: (preset: EffectPreset) => void;
  selectedEasing: EasingType;
  onEasingSelected: (easing: EasingType) => void;
  frameCount: number;
  onFrameCountChanged: (count: number) => void;
  totalDurationMs: number;
  onTotalDurationChanged: (ms: number) => void;
}

interface PresetItem {
  id: EffectPreset;
  title: string;
  description: string;
}

const PRESETS: PresetItem[] = [
  { id: "spin", title: "Spin / Rotate", description: "Rotates the cursor image through 360° across frames." },
  { id: "pulse", title: "Pulse / Breathe", description: "Scales the cursor size up and down with organic easing." },
  { id: "glow", title: "Glow Pulse", description: "Soft, pulsing ambient glow around the cursor." },
  { id: "bounce", title: "Bounce & Squash", description: "Vertical bounce with elastic squash on landing." },
  { id: "colorShift", title: "Color Shift", description: "Smoothly shifts the cursor color hue across a full loop." },
  { id: "particleTrail", title: "Particle Trail", description: "Magical trail of sparkling particles following the hotspot." },
  { id: "shake", title: "Shake / Jitter", description: "Hyper-energetic seeded-random position jitter." },
  { id: "emberFlicker", title: "🔥 Ember Flicker", description: "Fiery flicker with warm ember sparks floating upwards." },
  { id: "rippleRing", title: "💧 Ripple Ring", description: "Concentric blue water ripples emanating from hotspot." },
  { id: "snowFlake", title: "❄️ Snowflake Spin", description: "Soft, spinning crystalline hexagonal snowflakes." },
  { id: "rainbowTrail", title: "🌈 Rainbow Trail", description: "Spectral trailing colors changing hue along a path." },
  { id: "thunderStrike", title: "⚡ Static Arc / Bolt", description: "Energetic lightning strike sparking from top to hotspot." },
  { id: "nebulaSwirl", title: "🌌 Nebula Swirl", description: "Cosmic purple and magenta dust particles orbiting hotspot." },
  { id: "synthwaveGlow", title: "🌴 Synthwave Neon", description: "Cyberpunk dual-tone pink glow with cyan laser scanline." },
  { id: "rgbGlitch", title: "👾 RGB Split Glitch", description: "Horizontal row displacement with retro cyan/magenta digital bars." },
  { id: "fairyDust", title: "✨ Fairy Star Dust", description: "Spiraling gold glitter star sparkles floating around hotspot." },
  { id: "bloodDrip", title: "🩸 Blood Drip", description: "Gothic, crimson red droplets dripping down from hotspot." },
  { id: "beatPulse", title: "🎵 Music Beat Pulse", description: "Bouncing audio equalizer bars surrounding the cursor." },
  { id: "fireAndIce", title: "🔮 Fire & Ice Aura", description: "Premium hybrid of orange flames and cyan ice crystal sparkles." },
  { id: "fire", title: "🔥 Cosmic Firestorm", description: "Roaring procedural flame storm rising behind the cursor." },
  { id: "dragon", title: "🐉 Jade Dragon Spirit", description: "Glow-guided emerald-jade and gold dragon coiling around the clickpoint." },
  { id: "laser", title: "⚡ Cyberpunk Laser Beam", description: "A white-hot futuristic pulsing laser line with high neon pink outer glow." },
  { id: "matrixRain", title: "📟 Matrix Digital Rain", description: "Green digital rain cascading down from the pointer." },
  { id: "heartBurst", title: "💖 Heart Burst Bubble", description: "Pulsing pink hearts floating upwards around the hotspot." },
  { id: "goldRing", title: "✨ Golden Orbit Ring", description: "Spinning rings of gold dust swirling behind the pointer." },
  { id: "snowBlizzard", title: "❄️ Snowy Blizzard Drift", description: "Gusts of snowy crystalline particles blowing sideways." },
  { id: "chromaWave", title: "🌈 Chroma Radial Wave", description: "A vibrant flowing color-cycling spectrum aura." },
  { id: "quantumSpark", title: "⚛️ Quantum Spark Orbit", description: "Multicolor particles spinning in 3D electron orbits." },
  { id: "retroPortal", title: "🌀 Retro Pixel Portal", description: "A rotating pixelated neon portal swirling behind the pointer." },
  { id: "glitchScanner", title: "📟 Neon Glitch Scanner", description: "A futuristic green scanning line with active horizontal row slice-shifts." },
  { id: "cosmicSupernova", title: "💥 Cosmic Supernova Blast", description: "An expanding energetic celestial explosion with warm star-flares." },
  { id: "portalVortex", title: "🌀 Swirling Portal Vortex", description: "A rotating time-space neon black-hole vortex behind the cursor." },
  { id: "heartbeat", title: "💓 Heartbeat Throb", description: "Double-beat physical pulse scale with a glowing red throb." },
  { id: "plasmaShield", title: "🛡️ Plasma Forcefield", description: "Pulsing cyan/violet energy bubble shielding the pointer." },
  { id: "superSaiyan", title: "🔥 Golden Aura Flare", description: "Flaming golden kinetic energy strands rising behind the cursor." },
  { id: "cherryBlossom", title: "🌸 Sakura Blossom Drift", description: "Soft pink cherry blossom petals spinning and falling around clickpoint." },
  { id: "electricSpark", title: "⚡ Electric Plasma Arc", description: "Chaotic cyan electrical arcs snapping between hotspot and boundaries." },
  { id: "poisonCloud", title: "☣️ Toxic Spore Cloud", description: "Green bubbling toxic spore cloud floating outwards." },
  { id: "waterSplash", title: "🌊 Tidal Wave Splash", description: "Blue oceanic droplets splashing up and outwards with physics." },
  { id: "disintegration", title: "🌌 Pixel Disintegration", description: "Dissolving pixel particles disintegrating and drifting away." },
  { id: "magmaCore", title: "🌋 Volcanic Magma Core", description: "Lava glow crackles and orange magma sparks rising." },
  { id: "goldenHalo", title: "😇 Celestial Golden Halo", description: "A divine spinning glowing golden ring orbiting above the hotspot." },
  { id: "dnaHelix", title: "🧬 DNA Helix Orbit", description: "Cyan and magenta double-stranded genetic helix spinning around hotspot." },
  { id: "discoParty", title: "🪩 Retro Disco Lights", description: "Multi-directional flashing colored disco light beams pivoting from center." },
  { id: "ghostPhantom", title: "👻 Phantom Echoes", description: "Multiple trailing semitransparent ghost cursors fading backwards." },
  { id: "vampireBats", title: "🦇 Haunted Vampire Bats", description: "Vampire bats flapping wings and flying outwards from clickpoint." },
  { id: "digitalMatrix", title: "📟 Cyber Binary Stream", description: "Cascading green binary 1s and 0s falling down around cursor." },
  { id: "bubblePop", title: "🫧 Fizzy Water Bubbles", description: "Floating translucent bubbles expanding and popping into sparkles." },
  { id: "blackHole", title: "🕳️ Gravitational Swirl", description: "Cosmic space-bending black hole vortex pulling everything in." },
  { id: "butterflyFlight", title: "🦋 Fluttering Butterflies", description: "Magical iridescent butterflies flapping wings around the pointer." },
  { id: "magicSpell", title: "🧙‍♂️ Wizard Spell Glyphs", description: "An ancient purple glowing runic spell shield rotating behind." },
  { id: "crystalShards", title: "💎 Prismatic Crystal Shards", description: "Prismatic diamond shards bursting and refracting rainbow light." },
  { id: "auroraBorealis", title: "🌌 Aurora Borealis Wave", description: "Flowing green-teal neon curtains waving dynamically in background." },
  { id: "steampunkGear", title: "⚙️ Steampunk Cog Gear", description: "Rotating physical bronze interlocking clockwork gear behind pointer." },
  { id: "kunaiTrail", title: "🗡️ Animated Kunai", description: "Procedural carbon-black ninja kunai blade with a swirling neon-green chakra trail." },
  { id: "narutoRasengan", title: "🌀 Swirling Rasengan", description: "An immersive rotating sphere of glowing blue chakra particles and energy spiral rings." },
  { id: "gokuSuperSaiyanBlue", title: "🌌 Goku Super Saiyan Blue Aura", description: "Cyan and indigo kinetic fire aura rising upwards with electric sparks." },
  { id: "ghostInTheShell", title: "🤖 Cyber Glitch Scan", description: "Holographic scanlines with horizontal shifting row slices." },
  { id: "phoenixRise", title: "🐦 Phoenix Wings Flap", description: "Flapping golden and crimson fire wings behind the pointer." },
  { id: "cosmicNebulaEye", title: "👁️ Cosmic Nebula Eye", description: "Orbiting galaxy rings swirling around cosmic dark matter." },
  { id: "glitchRave", title: "⚡ Glitch Rave Equalizer", description: "High-frequency pulsing neon green and pink music bars." },
  { id: "luffyGearFifth", title: "☁️ Luffy Gear 5 Cloud", description: "White puffy cartoon smoke rings orbiting with golden sun glow." },
  { id: "zenGarden", title: "🎋 Zen Ripple Leaf", description: "Calm sand ripples with floating tea leaves and cherry blossoms." },
  { id: "demonSlayerSlash", title: "⚔️ Demon Slayer Slash", description: "Coiling water dragon waves and fire swirls sweeping the pointer." },
  { id: "sonicBoom", title: "💨 Sonic Boom Cone", description: "Expanding high-velocity shockwave circles with speed trails." },
  { id: "pixelRain", title: "👾 Retro Pixel Rain", description: "8-bit block pixel raindrops cascading down with retro grid splashes." },
  { id: "magicRunicCircle", title: "🔮 Magic Runic Shield", description: "Rotating ancient runic circle glyph shields with inner hexagram stars." },
  { id: "laserSaber", title: "⚔️ Crossed Laser Sabers", description: "Dual green and red plasma saber bars discharging electricity." }
];

/**
 * Renders a tiny animated canvas showing the preset effect
 */
const MiniEffectPreview: React.FC<{ preset: EffectPreset }> = ({ preset }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId: number;
    let angle = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw checkerboard
      const size = 4;
      for (let y = 0; y < h; y += size) {
        for (let x = 0; x < w; x += size) {
          ctx.fillStyle = (x / size + y / size) % 2 === 0 ? "rgba(40, 40, 40, 0.4)" : "rgba(20, 20, 20, 0.4)";
          ctx.fillRect(x, y, size, size);
        }
      }

      ctx.save();

      // Draw a simple cursor shape (triangle pointer)
      const drawCursor = (col: string = "#B8ADA3") => {
        ctx.fillStyle = col;
        ctx.strokeStyle = "#F3EDE7";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(8, 6);
        ctx.lineTo(20, 14);
        ctx.lineTo(14, 15);
        ctx.lineTo(18, 22);
        ctx.lineTo(15, 23);
        ctx.lineTo(11, 16);
        ctx.lineTo(8, 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };

      const now = Date.now() / 1000;

      switch (preset) {
        case "spin":
          ctx.translate(w / 2, h / 2);
          ctx.rotate(now * Math.PI * 1.5);
          ctx.translate(-w / 2, -h / 2);
          drawCursor();
          break;

        case "pulse": {
          const s = 1.0 + 0.25 * Math.sin(now * Math.PI * 2.5);
          ctx.translate(14, 14);
          ctx.scale(s, s);
          ctx.translate(-14, -14);
          drawCursor();
          break;
        }

        case "glow": {
          const glowAlpha = 0.2 + 0.6 * (0.5 + 0.5 * Math.sin(now * Math.PI * 2.5));
          ctx.shadowColor = "#E8793A";
          ctx.shadowBlur = 6;
          ctx.globalAlpha = glowAlpha;
          drawCursor("#E8793A");
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1.0;
          drawCursor();
          break;
        }

        case "bounce": {
          const bounceY = -5 * Math.abs(Math.sin(now * Math.PI * 1.5));
          const isImpact = Math.abs(Math.sin(now * Math.PI * 1.5)) < 0.25;
          if (isImpact) {
            ctx.translate(w / 2, h);
            ctx.scale(1.08, 0.9);
            ctx.translate(-w / 2, -h);
          }
          ctx.translate(0, bounceY);
          drawCursor();
          break;
        }

        case "colorShift":
          ctx.filter = `hue-rotate(${now * 150}deg)`;
          drawCursor("#E8793A");
          break;

        case "particleTrail": {
          drawCursor();
          // Draw trail
          ctx.shadowColor = "#E8793A";
          ctx.shadowBlur = 3;
          ctx.fillStyle = "#E8793A";
          for (let p = 1; p <= 3; p++) {
            const progress = (now + p * 0.15) % 1;
            ctx.globalAlpha = 1 - progress;
            ctx.beginPath();
            ctx.arc(14 - progress * 10, 14 + progress * 12, (1 - progress) * 3 + 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }

        case "shake": {
          const dx = Math.sin(now * 50) * 1.5;
          const dy = Math.cos(now * 60) * 1.5;
          ctx.translate(dx, dy);
          drawCursor();
          break;
        }

        case "emberFlicker": {
          ctx.globalAlpha = 0.8 + 0.2 * Math.sin(now * 25);
          drawCursor();
          ctx.globalAlpha = 1.0;
          ctx.shadowColor = "#FF4500";
          ctx.shadowBlur = 3;
          for (let p = 0; p < 4; p++) {
            const prg = (now * 0.8 + p * 0.25) % 1;
            const sx = 14 + Math.sin(prg * Math.PI * 3) * 3;
            const sy = 14 - prg * 12;
            ctx.fillStyle = prg > 0.5 ? "#FFD700" : "#FF5500";
            ctx.beginPath();
            ctx.arc(sx, sy, (1 - prg) * 2 + 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }

        case "rippleRing": {
          drawCursor();
          ctx.strokeStyle = "#38BDF8";
          ctx.lineWidth = 1;
          for (let p = 0; p < 2; p++) {
            const prg = (now * 0.6 + p * 0.5) % 1;
            ctx.globalAlpha = 1 - prg;
            ctx.beginPath();
            ctx.arc(14, 14, prg * 14, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        }

        case "snowFlake": {
          drawCursor();
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 0.8;
          for (let p = 0; p < 3; p++) {
            const prg = (now * 0.5 + p * 0.33) % 1;
            ctx.globalAlpha = 1 - prg;
            const fx = 14 + Math.sin(prg * Math.PI * 2) * 5;
            const fy = 14 + prg * 10;
            ctx.beginPath();
            ctx.moveTo(fx - 2, fy); ctx.lineTo(fx + 2, fy);
            ctx.moveTo(fx, fy - 2); ctx.lineTo(fx, fy + 2);
            ctx.stroke();
          }
          break;
        }

        case "rainbowTrail": {
          drawCursor();
          for (let p = 1; p <= 4; p++) {
            const prg = (now + p * 0.2) % 1;
            ctx.globalAlpha = 1 - prg;
            ctx.fillStyle = `hsl(${prg * 360}, 100%, 60%)`;
            ctx.beginPath();
            ctx.arc(14 - prg * 10, 14 + prg * 10, (1 - prg) * 2.5 + 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }

        case "thunderStrike": {
          drawCursor();
          const strike = Math.sin(now * 40) > 0.4;
          if (strike) {
            ctx.strokeStyle = "#00FFFF";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(14, 2);
            ctx.lineTo(11, 7);
            ctx.lineTo(15, 7);
            ctx.lineTo(14, 14);
            ctx.stroke();
          }
          break;
        }

        case "nebulaSwirl": {
          drawCursor();
          ctx.shadowColor = "#8A2BE2";
          ctx.shadowBlur = 2;
          for (let p = 0; p < 4; p++) {
            const rad = (now * 4) + (p * Math.PI / 2);
            const nx = 14 + Math.cos(rad) * 6;
            const ny = 14 + Math.sin(rad) * 6;
            ctx.fillStyle = p % 2 === 0 ? "#FF1493" : "#00FFFF";
            ctx.beginPath();
            ctx.arc(nx, ny, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }

        case "synthwaveGlow": {
          ctx.shadowColor = "#FF1493";
          ctx.shadowBlur = 5;
          drawCursor("#FF1493");
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
          
          const scanY = ((now * 15) % h);
          ctx.strokeStyle = "#00FFFF";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, scanY);
          ctx.lineTo(w, scanY);
          ctx.stroke();
          break;
        }

        case "rgbGlitch": {
          const split = Math.sin(now * 30) > 0.5;
          if (split) {
            ctx.save();
            ctx.translate(-1.5, 0);
            drawCursor("#FF1497");
            ctx.restore();
            ctx.save();
            ctx.translate(1.5, 0);
            drawCursor("#00FFFF");
            ctx.restore();
          } else {
            drawCursor();
          }
          break;
        }

        case "fairyDust": {
          drawCursor();
          ctx.fillStyle = "#FFD700";
          ctx.shadowColor = "#FFD700";
          ctx.shadowBlur = 2;
          for (let p = 0; p < 4; p++) {
            const prg = (now * 0.8 + p * 0.25) % 1;
            const angle = prg * Math.PI * 4;
            const rad = 7 * (1 - prg) + 1;
            const sx = 14 + Math.cos(angle) * rad;
            const sy = 14 + Math.sin(angle) * rad - prg * 4;
            ctx.globalAlpha = 1 - prg;
            ctx.beginPath();
            ctx.arc(sx, sy, 1, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }

        case "bloodDrip": {
          drawCursor();
          const prg = (now * 0.7) % 1;
          ctx.fillStyle = "#B22222";
          ctx.beginPath();
          ctx.arc(14, 14 + prg * 12, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#B22222";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(14, 14);
          ctx.lineTo(14, 14 + prg * 12);
          ctx.stroke();
          break;
        }

        case "beatPulse": {
          drawCursor();
          ctx.fillStyle = "#E8793A";
          for (let p = 0; p < 3; p++) {
            const h1 = Math.abs(Math.sin(now * 8 + p * 2)) * 6 + 1;
            ctx.fillRect(2 + p * 2, h - h1 - 2, 1.5, h1);
            ctx.fillRect(w - 4 - p * 2, h - h1 - 2, 1.5, h1);
          }
          break;
        }

        case "fireAndIce": {
          drawCursor();
          // Fire spark left
          const fPrg = (now * 0.8) % 1;
          ctx.fillStyle = "#FF4500";
          ctx.globalAlpha = 1 - fPrg;
          ctx.beginPath();
          ctx.arc(8 - fPrg * 4, 14 - fPrg * 5, 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Ice snowflake right
          const iPrg = (now * 0.8 + 0.5) % 1;
          ctx.fillStyle = "#00FFFF";
          ctx.globalAlpha = 1 - iPrg;
          ctx.beginPath();
          ctx.arc(20 + iPrg * 4, 14 + iPrg * 5, 1.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case "fire": {
          ctx.save();
          // Glow and background flames
          ctx.shadowBlur = 4;
          ctx.shadowColor = "#FF3300";
          for (let p = 0; p < 4; p++) {
            const fPrg = (now * 1.1 + p * 0.25) % 1;
            const fx = 14 + Math.sin(fPrg * Math.PI * 4 + p) * 3;
            const fy = h - fPrg * (h * 0.8);
            ctx.fillStyle = fPrg > 0.6 ? "#FFFFEE" : (fPrg > 0.35 ? "#FFCC00" : "#FF3300");
            ctx.globalAlpha = (1 - fPrg) * 0.8;
            ctx.beginPath();
            ctx.arc(fx, fy, (1 - fPrg) * 3 + 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
          drawCursor();
          break;
        }

        case "dragon": {
          drawCursor();
          // Miniature coiling dragon
          ctx.save();
          const segments = 6;
          for (let s = 0; s < segments; s++) {
            const segT = (now * 1.5 - s * 0.08 + 1.0) % 1.0;
            const angle = segT * Math.PI * 4;
            const radius = 6 + 2 * Math.sin(segT * Math.PI * 4);
            const dx = 14 + Math.cos(angle) * radius;
            const dy = 14 + Math.sin(angle) * radius;
            const isHead = s === 0;
            ctx.fillStyle = isHead ? "#FFD700" : "#00FFCC";
            ctx.globalAlpha = 1 - s / segments;
            ctx.beginPath();
            ctx.arc(dx, dy, isHead ? 2.2 : 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
          break;
        }

        case "laser": {
          drawCursor();
          // Miniature pulsing laser beam
          ctx.save();
          const pulseThickness = 0.8 + Math.sin(now * 25) * 0.4;
          ctx.strokeStyle = "#FF0055";
          ctx.lineWidth = pulseThickness * 2.5;
          ctx.beginPath();
          ctx.moveTo(14, 14);
          ctx.lineTo(w - 2, 2);
          ctx.stroke();

          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = pulseThickness;
          ctx.beginPath();
          ctx.moveTo(14, 14);
          ctx.lineTo(w - 2, 2);
          ctx.stroke();
          ctx.restore();
          break;
        }

        case "matrixRain": {
          drawCursor();
          ctx.fillStyle = "#00FF00";
          ctx.font = "bold 4px monospace";
          for (let j = 0; j < 3; j++) {
            const y = 8 + ((now * 15 + j * 6) % 18);
            ctx.fillText(Math.floor(Math.sin(now * 10 + j) * 9).toString(), 10 + j * 4, y);
          }
          break;
        }

        case "heartBurst": {
          drawCursor();
          ctx.fillStyle = "#FF2E93";
          for (let p = 0; p < 3; p++) {
            const prg = (now * 0.5 + p * 0.33) % 1;
            ctx.globalAlpha = 1 - prg;
            const hx = 14 + Math.sin(prg * Math.PI * 2) * 4;
            const hy = 14 - prg * 10;
            ctx.beginPath();
            ctx.arc(hx, hy, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }

        case "goldRing": {
          drawCursor();
          ctx.strokeStyle = "#FFD700";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.ellipse(14, 14, 8, 4, Math.PI / 6, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }

        case "snowBlizzard": {
          drawCursor();
          ctx.fillStyle = "#FFFFFF";
          for (let p = 0; p < 3; p++) {
            const prg = (now * 0.6 + p * 0.33) % 1;
            ctx.globalAlpha = 1 - prg;
            ctx.beginPath();
            ctx.arc(22 - prg * 12, 6 + prg * 14, 1.0, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }

        case "chromaWave": {
          ctx.save();
          ctx.filter = `hue-rotate(${now * 180}deg)`;
          drawCursor("#38BDF8");
          ctx.restore();
          break;
        }

        case "quantumSpark": {
          drawCursor();
          ctx.fillStyle = "#00FFFF";
          const orbT = now * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(14 + Math.cos(orbT) * 6, 14 + Math.sin(orbT) * 3, 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#FF00FF";
          ctx.beginPath();
          ctx.arc(14 - Math.cos(orbT) * 5, 14 - Math.sin(orbT) * 4, 1.2, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case "retroPortal": {
          ctx.strokeStyle = `hsl(${(now * 100) % 360}, 90%, 60%)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(14, 14, 4 + Math.sin(now * 10) * 1.5, 0, Math.PI * 2);
          ctx.stroke();
          drawCursor();
          break;
        }

        case "glitchScanner": {
          ctx.strokeStyle = "#10B981";
          ctx.lineWidth = 1;
          const scanY = 4 + (Math.sin(now * 5) * 0.5 + 0.5) * 24;
          ctx.beginPath();
          ctx.moveTo(4, scanY);
          ctx.lineTo(28, scanY);
          ctx.stroke();
          drawCursor();
          break;
        }

        case "cosmicSupernova": {
          const sRad = 1 + (now * 25) % 12;
          ctx.fillStyle = "rgba(239, 68, 68, " + (1 - (now * 2 % 1)) + ")";
          ctx.beginPath();
          ctx.arc(14, 14, sRad, 0, Math.PI * 2);
          ctx.fill();
          drawCursor();
          break;
        }

        case "portalVortex": {
          ctx.strokeStyle = "#8B5CF6";
          ctx.lineWidth = 0.8;
          ctx.save();
          ctx.translate(14, 14);
          ctx.rotate(now * Math.PI * 2);
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          drawCursor();
          break;
        }

        case "heartbeat": {
          const beatT = now * Math.PI * 2;
          const pulse = Math.pow(Math.max(0, Math.sin(beatT) + 0.2 * Math.sin(beatT * 2)), 4);
          const s = 1.0 + 0.15 * pulse;
          ctx.save();
          ctx.translate(14, 14);
          ctx.scale(s, s);
          ctx.translate(-14, -14);
          drawCursor("#EF4444");
          ctx.restore();
          break;
        }

        case "plasmaShield": {
          ctx.strokeStyle = "rgba(147, 197, 253, 0.8)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(14, 14, 11 + Math.sin(now * 6) * 1.5, 0, Math.PI * 2);
          ctx.stroke();
          drawCursor();
          break;
        }

        case "superSaiyan": {
          ctx.fillStyle = "rgba(251, 191, 36, 0.4)";
          ctx.beginPath();
          ctx.arc(14, 14, 8 + Math.sin(now * 10) * 2, 0, Math.PI * 2);
          ctx.fill();
          drawCursor();
          break;
        }

        case "cherryBlossom": {
          drawCursor();
          ctx.fillStyle = "rgba(244, 143, 177, 0.9)";
          const pY = 4 + (now * 15) % 24;
          ctx.beginPath();
          ctx.arc(8 + Math.sin(now * 4) * 4, pY, 1.5, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case "electricSpark": {
          drawCursor();
          ctx.strokeStyle = "#22D3EE";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(14, 14);
          ctx.lineTo(14 + Math.sin(now * 40) * 8, 14 + Math.cos(now * 30) * 8);
          ctx.stroke();
          break;
        }

        case "poisonCloud": {
          ctx.fillStyle = "rgba(34, 197, 94, 0.4)";
          ctx.beginPath();
          ctx.arc(14, 14, 7 + Math.sin(now * 8) * 1.5, 0, Math.PI * 2);
          ctx.fill();
          drawCursor();
          break;
        }

        case "waterSplash": {
          drawCursor();
          ctx.fillStyle = "#38BDF8";
          const dY = 14 + (now * 12) % 15;
          ctx.fillRect(8, dY, 1.5, 1.5);
          ctx.fillRect(18, dY - 2, 1.5, 1.5);
          break;
        }

        case "disintegration": {
          drawCursor();
          ctx.fillStyle = "rgba(232, 121, 58, 0.7)";
          const partX = 14 + (now * 10) % 14;
          ctx.fillRect(partX, 10, 1.2, 1.2);
          break;
        }

        case "magmaCore": {
          ctx.fillStyle = "rgba(249, 115, 22, 0.4)";
          ctx.beginPath();
          ctx.arc(14, 14, 6 + Math.sin(now * 5) * 1.5, 0, Math.PI * 2);
          ctx.fill();
          drawCursor();
          break;
        }

        case "goldenHalo": {
          drawCursor();
          ctx.strokeStyle = "#FBBF24";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.ellipse(14, 5, 6, 1.5, 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }

        case "dnaHelix": {
          drawCursor();
          ctx.fillStyle = "#22D3EE";
          ctx.beginPath();
          ctx.arc(14 + Math.sin(now * 6) * 5, 8, 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#EC4899";
          ctx.beginPath();
          ctx.arc(14 - Math.sin(now * 6) * 5, 20, 1.2, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        case "discoParty": {
          const rHue = (now * 150) % 360;
          ctx.fillStyle = `hsla(${rHue}, 100%, 60%, 0.25)`;
          ctx.fillRect(0, 0, w, h);
          drawCursor();
          break;
        }

        case "ghostPhantom": {
          ctx.globalAlpha = 0.4;
          ctx.save();
          ctx.translate(-2, 2);
          drawCursor();
          ctx.restore();
          ctx.globalAlpha = 1.0;
          drawCursor();
          break;
        }

        case "vampireBats": {
          drawCursor();
          ctx.fillStyle = "#1E1B4B";
          const flap = Math.sin(now * 10) > 0;
          ctx.save();
          ctx.translate(14, 6 + Math.sin(now * 5) * 2);
          ctx.beginPath();
          if (flap) {
            ctx.moveTo(0, 0); ctx.lineTo(-2, -1.5); ctx.lineTo(-0.5, 0); ctx.lineTo(0, 1); ctx.lineTo(0.5, 0); ctx.lineTo(2, -1.5);
          } else {
            ctx.moveTo(0, 0); ctx.lineTo(-2.5, 0.5); ctx.lineTo(-0.5, 0.2); ctx.lineTo(0, 1.5); ctx.lineTo(0.5, 0.2); ctx.lineTo(2.5, 0.5);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          break;
        }

        case "digitalMatrix": {
          drawCursor();
          ctx.fillStyle = "#10B981";
          ctx.font = "bold 5px monospace";
          ctx.fillText("1", 4, 10 + (now * 10) % 20);
          ctx.fillText("0", 24, 6 + (now * 12) % 20);
          break;
        }

        case "bubblePop": {
          drawCursor();
          ctx.strokeStyle = "rgba(186, 230, 253, 0.8)";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(8, 24 - (now * 8) % 24, 2, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }

        case "blackHole": {
          ctx.save();
          ctx.translate(14, 14);
          ctx.rotate(-now * Math.PI * 2);
          ctx.strokeStyle = "#8B5CF6";
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          drawCursor();
          break;
        }

        case "butterflyFlight": {
          drawCursor();
          ctx.fillStyle = "#EC4899";
          ctx.save();
          ctx.translate(22 + Math.cos(now * 4) * 4, 10 + Math.sin(now * 4) * 4);
          ctx.beginPath();
          ctx.ellipse(-1, 0, 1.5, 1, Math.PI/4, 0, Math.PI * 2);
          ctx.ellipse(1, 0, 1.5, 1, -Math.PI/4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        }

        case "magicSpell": {
          ctx.strokeStyle = "rgba(168, 85, 247, 0.5)";
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.arc(14, 14, 11, 0, Math.PI * 2);
          ctx.stroke();
          drawCursor();
          break;
        }

        case "crystalShards": {
          drawCursor();
          ctx.fillStyle = "rgba(147, 197, 253, 0.6)";
          ctx.fillRect(20 + Math.sin(now * 12) * 2, 8 + Math.cos(now * 12) * 2, 2, 2);
          break;
        }

        case "auroraBorealis": {
          ctx.fillStyle = "rgba(34, 197, 94, 0.15)";
          ctx.fillRect(0, 0, w, h);
          drawCursor();
          break;
        }

        case "steampunkGear": {
          ctx.save();
          ctx.translate(14, 14);
          ctx.rotate(now * Math.PI);
          ctx.fillStyle = "#B45309";
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          drawCursor();
          break;
        }

        case "kunaiTrail": {
          ctx.save();
          // Green trail
          ctx.fillStyle = "#22C55E";
          for (let p = 1; p <= 3; p++) {
            const prg = (now * 1.2 + p * 0.25) % 1;
            ctx.globalAlpha = 1 - prg;
            // Trail extends bottom-right
            ctx.beginPath();
            ctx.arc(14 + prg * 10, 14 + prg * 10, (1 - prg) * 2.2 + 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          // Miniature Kunai
          ctx.save();
          ctx.translate(14, 14);
          ctx.rotate(Math.PI / 4);
          
          // Blade left
          ctx.fillStyle = "#1E293B";
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-2.5, 7);
          ctx.lineTo(0, 10);
          ctx.closePath();
          ctx.fill();

          // Blade right
          ctx.fillStyle = "#94A3B8";
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(2.5, 7);
          ctx.lineTo(0, 10);
          ctx.closePath();
          ctx.fill();

          // Grip
          ctx.fillStyle = "#E2E8F0";
          ctx.fillRect(-0.8, 10, 1.6, 5);

          // Ring
          ctx.strokeStyle = "#64748B";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(0, 16.5, 1.2, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();
          break;
        }

        case "narutoRasengan": {
          drawCursor();
          ctx.save();
          const cx = 14;
          const cy = 14;

          // Glowing blue core
          const coreRadius = 5 + Math.sin(now * Math.PI * 3) * 1;
          const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, coreRadius);
          grad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
          grad.addColorStop(0.5, "rgba(56, 189, 248, 0.7)");
          grad.addColorStop(1, "rgba(2, 132, 199, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
          ctx.fill();

          // Small swirling orbital particles using sine/cosine waves
          ctx.fillStyle = "#FFFFFF";
          for (let p = 0; p < 4; p++) {
            const angle = now * Math.PI * 4 + p * (Math.PI / 2);
            const r = 5 + Math.sin(now * Math.PI * 2 + p) * 1.5;
            const px = cx + Math.cos(angle) * r;
            const py = cy + Math.sin(angle) * r;
            ctx.fillStyle = p % 2 === 0 ? "#FFFFFF" : "#38BDF8";
            ctx.beginPath();
            ctx.arc(px, py, 1.0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
          break;
        }

        case "gokuSuperSaiyanBlue": {
          ctx.save();
          for (let j = 0; j < 5; j++) {
            const yp = (now + j * 0.2) % 1;
            ctx.fillStyle = `rgba(34, 211, 238, ${1 - yp})`;
            ctx.beginPath();
            ctx.arc(8 + j * 3, h - yp * h, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
          drawCursor();
          break;
        }

        case "ghostInTheShell": {
          drawCursor();
          ctx.save();
          const scanY = Math.floor(now * 25) % h;
          ctx.strokeStyle = "#10B981";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, scanY);
          ctx.lineTo(w, scanY);
          ctx.stroke();
          ctx.restore();
          break;
        }

        case "phoenixRise": {
          ctx.save();
          const flap = Math.sin(now * 8) * 0.2;
          ctx.fillStyle = "#F59E0B";
          ctx.beginPath();
          ctx.arc(14, 14, 4, 0, Math.PI * 2);
          ctx.fill();
          
          // wings
          ctx.fillStyle = "#EF4444";
          ctx.beginPath();
          ctx.ellipse(8, 14, 4, 2, -flap, 0, Math.PI * 2);
          ctx.ellipse(20, 14, 4, 2, flap, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          drawCursor();
          break;
        }

        case "cosmicNebulaEye": {
          drawCursor();
          ctx.save();
          ctx.strokeStyle = "#DB2777";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.ellipse(14, 14, 8, 3, now * Math.PI, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          break;
        }

        case "glitchRave": {
          drawCursor();
          ctx.save();
          ctx.fillStyle = "#22C55E";
          ctx.fillRect(2, h - 4, 3, Math.abs(Math.sin(now * 5)) * 4);
          ctx.fillStyle = "#EC4899";
          ctx.fillRect(8, h - 4, 3, Math.abs(Math.cos(now * 5)) * 4);
          ctx.fillStyle = "#06B6D4";
          ctx.fillRect(14, h - 4, 3, Math.abs(Math.sin(now * 7)) * 4);
          ctx.restore();
          break;
        }

        case "luffyGearFifth": {
          ctx.save();
          ctx.fillStyle = "#FFFFFF";
          ctx.strokeStyle = "#E2E8F0";
          ctx.lineWidth = 0.5;
          for (let j = 0; j < 3; j++) {
            const ang = now * Math.PI * 2 + j * 2;
            ctx.beginPath();
            ctx.arc(14 + Math.cos(ang) * 6, 14 + Math.sin(ang) * 5, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();
          drawCursor();
          break;
        }

        case "zenGarden": {
          ctx.save();
          ctx.strokeStyle = "rgba(224, 242, 254, 0.4)";
          ctx.beginPath();
          ctx.arc(14, 14, (now * 15) % 15, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          drawCursor();
          break;
        }

        case "demonSlayerSlash": {
          drawCursor();
          ctx.save();
          ctx.strokeStyle = "#38BDF8";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(14, 14, 7, now * Math.PI, now * Math.PI + Math.PI);
          ctx.stroke();
          ctx.restore();
          break;
        }

        case "sonicBoom": {
          drawCursor();
          ctx.save();
          ctx.strokeStyle = "#38BDF8";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(14, 14, (now * 16) % 16, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          break;
        }

        case "pixelRain": {
          drawCursor();
          ctx.save();
          ctx.fillStyle = "#34D399";
          ctx.fillRect(4, (now * 20) % h, 1.5, 1.5);
          ctx.fillRect(18, ((now + 0.3) * 15) % h, 1.5, 1.5);
          ctx.restore();
          break;
        }

        case "magicRunicCircle": {
          ctx.save();
          ctx.strokeStyle = "#FBBF24";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(14, 14, 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          drawCursor();
          break;
        }

        case "laserSaber": {
          drawCursor();
          ctx.save();
          ctx.strokeStyle = "#EF4444";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(4, 24);
          ctx.lineTo(24, 4);
          ctx.stroke();
          ctx.restore();
          break;
        }

        default:
          drawCursor();
          break;
      }

      ctx.restore();
      frameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [preset]);

  return (
    <canvas
      ref={canvasRef}
      width={32}
      height={32}
      className="block rounded bg-[#101010] border border-white/5 w-10 h-10 select-none pointer-events-none"
    />
  );
};

export const EffectGallery: React.FC<EffectGalleryProps> = ({
  selectedPreset,
  onPresetSelected,
  selectedEasing,
  onEasingSelected,
  frameCount,
  onFrameCountChanged,
  totalDurationMs,
  onTotalDurationChanged,
}) => {
  const [category, setCategory] = useState<"all" | "classic" | "new" | "favorites">("all");
  const [customFramesInput, setCustomFramesInput] = useState<string>(String(frameCount));

  useEffect(() => {
    setCustomFramesInput(String(frameCount));
  }, [frameCount]);

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("effect_favorites");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("effect_favorites", JSON.stringify(updated));
      return updated;
    });
  };

  const newPresetIds = [
    "matrixRain",
    "heartBurst",
    "goldRing",
    "snowBlizzard",
    "chromaWave",
    "quantumSpark",
    "retroPortal",
    "glitchScanner",
    "cosmicSupernova",
    "portalVortex",
    "heartbeat",
    "plasmaShield",
    "superSaiyan",
    "cherryBlossom",
    "electricSpark",
    "poisonCloud",
    "waterSplash",
    "disintegration",
    "magmaCore",
    "goldenHalo",
    "dnaHelix",
    "discoParty",
    "ghostPhantom",
    "vampireBats",
    "digitalMatrix",
    "bubblePop",
    "blackHole",
    "butterflyFlight",
    "magicSpell",
    "crystalShards",
    "auroraBorealis",
    "steampunkGear",
    "kunaiTrail",
    "narutoRasengan",
    "gokuSuperSaiyanBlue",
    "ghostInTheShell",
    "phoenixRise",
    "cosmicNebulaEye",
    "glitchRave",
    "luffyGearFifth",
    "zenGarden",
    "demonSlayerSlash",
    "sonicBoom",
    "pixelRain",
    "magicRunicCircle",
    "laserSaber",
  ];

  const filteredPresets = PRESETS.filter((p) => {
    if (category === "classic") return !newPresetIds.includes(p.id);
    if (category === "new") return newPresetIds.includes(p.id);
    if (category === "favorites") return favorites.includes(p.id);
    return true;
  });

  return (
    <div className="flex flex-col space-y-5 p-5 rounded-2xl bg-white/[0.02] border border-white/10">
      <div className="flex items-center space-x-2 text-[#F3EDE7]">
        <Sparkles className="w-4.5 h-4.5 text-[#E8793A]" />
        <h3 className="font-bold text-sm tracking-tight">Auto-Animate Presets</h3>
      </div>

      <div className="h-px bg-white/10 w-full"></div>

      {/* 1. Easing selection dropdown */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#F3EDE7] uppercase tracking-wider block">Easing Curve</label>
        <select
          value={["linear", "ease-in", "ease-out", "ease-in-out"].includes(selectedEasing) ? selectedEasing : "custom"}
          onChange={(e) => {
            if (e.target.value !== "custom") {
              onEasingSelected(e.target.value as EasingType);
            }
          }}
          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-[#F3EDE7] focus:border-[#E8793A] focus:outline-none cursor-pointer"
        >
          <option value="linear">Linear (Constant speed)</option>
          <option value="ease-in">Ease-In (Slow start, accelerates)</option>
          <option value="ease-out">Ease-Out (Fast start, decelerates)</option>
          <option value="ease-in-out">Ease-In-Out (Symmetric slow-fast-slow)</option>
          {!["linear", "ease-in", "ease-out", "ease-in-out"].includes(selectedEasing) && (
            <option value="custom">Custom: {selectedEasing.startsWith("cubic-bezier") ? "Custom Bezier" : selectedEasing}</option>
          )}
        </select>
      </div>

      {/* 2. Sliders */}
      <div className="space-y-4">
        {/* Frame Count Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-[#B8ADA3]">
            <span>Frame Count</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[#E8793A] font-bold bg-[#E8793A]/10 border border-[#E8793A]/20 px-1.5 py-0.5 rounded text-[11px]">{frameCount} frames</span>
            </div>
          </div>
          <input
            type="range"
            min="6"
            max="60"
            value={frameCount > 60 ? 60 : frameCount}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              onFrameCountChanged(val);
              setCustomFramesInput(String(val));
            }}
            className="w-full accent-[#E8793A] h-1.5 rounded bg-neutral-950/60 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
            <span>6 (Min)</span>
            <span>60 (Slider Max)</span>
          </div>

          {/* Custom Input Box widget */}
          <div className="bg-black/35 p-3 rounded-xl border border-white/5 space-y-2.5 mt-2 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#B8ADA3] uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#E8793A]" />
                <span>Custom Frame Count (1-240)</span>
              </span>
              {frameCount > 60 && (
                <span className="text-[9px] text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded font-mono font-bold border border-emerald-500/10">
                  Custom Active
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="240"
                value={customFramesInput}
                onChange={(e) => setCustomFramesInput(e.target.value)}
                placeholder="e.g. 80"
                className="flex-1 px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs font-mono font-bold text-[#F3EDE7] focus:border-[#E8793A] focus:outline-none"
              />
              <button
                onClick={() => {
                  const parsed = parseInt(customFramesInput);
                  const validated = isNaN(parsed) ? 18 : Math.max(1, Math.min(240, parsed));
                  onFrameCountChanged(validated);
                  setCustomFramesInput(String(validated));
                }}
                className="px-4 py-1.5 bg-[#E8793A] hover:bg-[#F28D50] text-[#1C1512] rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 hover:shadow-lg hover:shadow-[#E8793A]/10 active:scale-95"
              >
                <span>Apply</span>
              </button>
            </div>
            <p className="text-[9.5px] text-neutral-500 leading-normal font-mono">
              Type any frame count (even above 60) and press <strong className="text-[#E8793A]">Apply</strong> to render high-density animations.
            </p>
          </div>
        </div>

        {/* Total Loop Duration Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold text-[#B8ADA3]">
            <span>Total Loop Duration</span>
            <span className="font-mono text-[#E8793A]">{(totalDurationMs / 1000).toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min="1000"
            max="15000"
            step="100"
            value={totalDurationMs}
            onChange={(e) => onTotalDurationChanged(parseInt(e.target.value))}
            className="w-full accent-[#E8793A] h-1.5 rounded bg-neutral-950/60 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
            <span>1.0s</span>
            <span>15.0s (Max)</span>
          </div>
        </div>
      </div>

      {/* 3. Preset Quick Selector Dropdown */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#F3EDE7] uppercase tracking-wider block">Quick Dropdown Select</label>
        <select
          value={selectedPreset}
          onChange={(e) => onPresetSelected(e.target.value as EffectPreset)}
          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-[#F3EDE7] focus:border-[#E8793A] focus:outline-none cursor-pointer font-bold"
        >
          <optgroup label="✨ NEW CREATIVE PRESETS" className="text-[#E8793A] font-bold bg-[#1C1512]">
            {PRESETS.filter((p) => newPresetIds.includes(p.id)).map((p) => (
              <option key={p.id} value={p.id} className="bg-[#1C1512] text-[#F3EDE7] font-semibold">
                {p.title} (New)
              </option>
            ))}
          </optgroup>
          <optgroup label="⚡ CLASSIC PRESETS" className="text-[#B8ADA3] font-bold bg-[#1C1512]">
            {PRESETS.filter((p) => !newPresetIds.includes(p.id)).map((p) => (
              <option key={p.id} value={p.id} className="bg-[#1C1512] text-[#F3EDE7] font-semibold">
                {p.title}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* 4. Filter Tabs and Visual Preset Cards Grid */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#F3EDE7] uppercase tracking-wider block">Visual Preset Gallery</label>
          <span className="text-[10px] font-mono text-[#B8ADA3]">{filteredPresets.length} items</span>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-black/30 border border-white/5">
          <button
            onClick={() => setCategory("all")}
            className={`py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
              category === "all"
                ? "bg-[#E8793A] text-[#1C1512]"
                : "text-[#B8ADA3] hover:text-[#F3EDE7] hover:bg-white/[0.02]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setCategory("classic")}
            className={`py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
              category === "classic"
                ? "bg-[#E8793A] text-[#1C1512]"
                : "text-[#B8ADA3] hover:text-[#F3EDE7] hover:bg-white/[0.02]"
            }`}
          >
            Classic
          </button>
          <button
            onClick={() => setCategory("new")}
            className={`py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
              category === "new"
                ? "bg-[#E8793A] text-[#1C1512]"
                : "text-[#B8ADA3] hover:text-[#F3EDE7] hover:bg-white/[0.02]"
            }`}
          >
            New
          </button>
          <button
            onClick={() => setCategory("favorites")}
            className={`py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              category === "favorites"
                ? "bg-[#E8793A] text-[#1C1512]"
                : "text-[#B8ADA3] hover:text-[#F3EDE7] hover:bg-white/[0.02]"
            }`}
            title="My Favorited Presets"
          >
            <Heart className={`w-3 h-3 ${category === "favorites" ? "fill-[#1C1512]" : "fill-transparent text-[#B8ADA3]"}`} />
            <span>Favs</span>
          </button>
        </div>

        {/* Grid of Preset Cards */}
        {filteredPresets.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-white/10 bg-black/15">
            <Heart className="w-5 h-5 text-neutral-600 mx-auto mb-1.5" />
            <p className="text-xs text-neutral-400 font-bold">No favorites yet!</p>
            <p className="text-[10px] text-neutral-500 mt-0.5 leading-normal">Tap the heart on any preset to save it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {filteredPresets.map((p) => {
              const isSelected = selectedPreset === p.id;
              const isFav = favorites.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => onPresetSelected(p.id)}
                  className={`flex flex-col items-center justify-center aspect-square p-2.5 rounded-2xl border transition-all cursor-pointer select-none relative group ${
                    isSelected
                      ? "border-[#E8793A] bg-[#111625]/60 shadow-[0_0_15px_rgba(232,121,58,0.2)] scale-[1.03]"
                      : "border-white/5 bg-[#1C1512]/40 hover:border-white/10 hover:bg-[#111625]/40"
                  }`}
                  title={`${p.title}: ${p.description}`}
                >
                  {/* Heart Button at Top Right */}
                  <button
                    onClick={(e) => toggleFavorite(e, p.id)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/40 border border-white/5 hover:border-[#E8793A] transition-all hover:scale-110 cursor-pointer z-10"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-all ${
                        isFav ? "fill-[#E8793A] text-[#E8793A]" : "text-[#B8ADA3] group-hover:text-white"
                      }`}
                    />
                  </button>

                  {/* Mini looping animated canvas centered */}
                  <div className="flex-grow flex items-center justify-center mt-2">
                    <div className="transform scale-110 transition-transform group-hover:scale-120 duration-300">
                      <MiniEffectPreview preset={p.id} />
                    </div>
                  </div>

                  {/* Truncated Text Title */}
                  <div className="w-full text-center mt-1.5">
                    <h4 className={`text-[10px] font-bold leading-tight truncate px-1 transition-colors ${isSelected ? "text-[#E8793A]" : "text-[#B8ADA3] group-hover:text-[#F3EDE7]"}`}>
                      {p.title.replace(/^[\s\S]*?\s+/, "")}
                    </h4>
                  </div>

                  {/* Active Indicator */}
                  {isSelected && (
                    <div className="absolute left-1.5 top-1.5 bg-[#E8793A]/15 text-[#E8793A] text-[7px] font-black px-1.5 py-0.5 rounded border border-[#E8793A]/25 uppercase tracking-wide">
                      Active
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
