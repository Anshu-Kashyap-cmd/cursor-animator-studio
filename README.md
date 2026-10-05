# 🖱️ Cursor Animator Studio (.CUR / .ANI Creator & Video Processor)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28.svg?logo=firebase)](https://firebase.google.com/)

> **Cursor Animator Studio** is an all-in-one, professional web workstation for designing, animating, converting, and exporting high-fidelity Windows Animated Cursors (`.ani`), Static Cursors (`.cur`), Animated GIFs, and Spritesheets. Featuring client-side hardware-accelerated **Video-to-Frames Extraction**, custom visual effects, timeline tweening, chroma key background removal, and Firebase cloud project synchronization.

---

## 🌟 Key Features

### 1. 🎥 Video to Animated Cursor Extractor (`src/services/videoProcessor.ts`)
Convert real video clips (MP4, WebM, MOV) or direct video URLs into animated cursor frames:
- **Interval & Time Range Trimming**: Select custom start and end timestamps down to 10ms precision.
- **Frame Rate & Count**: Specify the target frame count (4 to 64 frames) or frame duration in milliseconds.
- **Dynamic Resolution**: Pick standard Windows cursor resolutions (16x16, 24x24, 32x32, 48x48, 64x64, 128x128).
- **Chroma Key & Background Removal**:
  - Auto Black-level removal
  - Auto White-level removal
  - Green Screen (`#00FF00`) with tolerance control
  - Blue Screen (`#0000FF`) with tolerance control
  - Custom Color Picker keying with delta distance threshold
- **Real-time Pixel & Video Effects**:
  - Live Hue Rotation (0° – 360°)
  - Brightness, Contrast, and Saturation adjustments
  - Invert Colors
  - Neon Outer Glow with custom accent colors
  - Pixelate / 8-bit Retro downsampler
- **Interactive Hotspot Placement**: Set hotspot position directly on the canvas preview or use one-click presets (Top-Left, Center, Pointer Tip).

---

### 2. ⏱️ Non-Linear Frame Timeline & Tweening Engine
- **Frame Management**: Add, duplicate, reorder, delete, and reverse frames effortlessly.
- **Individual Frame Durations**: Set custom durations per frame (in milliseconds or standard Windows cursor jiffies: 1 jiffy = 1/60th second).
- **AutoTween Interpolation**: Create smooth transition frames between any two keyframes with customizable easing curves:
  - Linear
  - Ease In / Ease Out / Ease In-Out
  - Elastic & Bounce
- **Ping-Pong & Loop Modes**: Toggle infinite looping, back-and-forth ping-pong playback, or single-shot animations.

---

### 3. 🧪 Live Interactive Sandbox & Cursor Simulator
- **Live Canvas Preview**: Test the animated cursor in real-time at 1x, 2x, 4x, and 8x zoom levels with pixel grid inspection.
- **Interactive Test Bench**: Hover, click, and drag over buttons, text fields, links, and canvas targets to test cursor feel.
- **Background Switcher**: Test cursor visibility against Dark, Light, Transparent Checkered, Blueprint, and Wallpaper backgrounds.
- **Cursor Trail Effects**: Test dynamic trail rendering (Star particle trails, Ghost frames, Neon blur).

---

### 4. 🪄 Cursor Magic Effects Suite
Transform any static icon or graphic into an animation with 1-click procedural effects:
- **Pulse & Breathe**: Scale oscillation with sine wave timing.
- **360° Smooth Spin**: Continuous rotational animation with anti-aliasing.
- **RGB Rainbow Cycle**: Hue-shifting color cycle across the spectrum.
- **Orbiting Sparkles**: Procedural star particles orbiting around the cursor hotspot.
- **Glitch & Cyberpunk Displacement**: Horizontal RGB chromatic split and jitter.
- **Shadow Float**: Hover elevation with dynamic drop-shadow motion.

---

### 5. 📦 Universal Export Suite
Export your creations in multiple industry-standard formats:
- **Windows Animated Cursor (`.ani`)**: Binary RIFF/ACON compliant container with `anih`, `rate`, `seq`, and `icon` frames, ready to apply directly in Windows 10/11 Mouse Settings.
- **Windows Static Cursor (`.cur`)**: Standard Windows cursor file with precise hotspot coordinates.
- **Animated GIF (`.gif`)**: Web-optimized animated GIF for sharing on Discord, GitHub, or portfolio websites.
- **Spritesheet & Atlas**: Horizontal or grid PNG spritesheet alongside a JSON atlas mapping coordinates.
- **PNG Frame Sequence (`.zip`)**: Compressed ZIP archive containing numbered individual transparent PNG frames.
- **CSS Code Snippet**: Instant CSS snippet (`cursor: url(...)`) with base64 data URI fallback for web development.

---

### 6. ☁️ Firebase Cloud Sync & Gallery
- **Project Cloud Persistence**: Save and reload projects with full timeline history in Firebase Firestore.
- **Public & Community Showcase**: Share curated cursor packs with unique links.
- **Local Storage Fallback**: Automatic offline persistence via IndexedDB (`idb-keyval`) ensures zero work loss even without an active internet connection.

---

## 🏗️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript | High-performance reactive UI with strict type safety |
| **Build & Dev Tooling**| Vite 6 + Tailwind CSS v4 | Sub-millisecond HMR and utility-first styling |
| **Video & Pixel Engine**| HTML5 Video & Canvas API | Fast client-side decoding, chroma keying, and filter processing |
| **Binary File Engine** | Native TypedArrays (`DataView`, `Uint8Array`) | Accurate RIFF/ACON `.ANI` and ICO/CUR binary serialization |
| **Backend & Dev Server**| Express 4 + TSX | Local API server and asset proxying |
| **Cloud Database** | Firebase Firestore 12 | User projects, cursor library, and metadata storage |
| **Icons & Animation** | Lucide React + Motion | Polished glassmorphic UI components and smooth transitions |

---

## 📂 Project Directory Structure

```text
├── src/
│   ├── components/                  # UI Components & Modal Windows
│   │   ├── AdvancedToolsStudio.tsx  # Advanced cursor editing panel
│   │   ├── AuthModal.tsx            # Firebase user login/signup
│   │   ├── AutoTweenTool.tsx        # Keyframe interpolation & easing curves
│   │   ├── ColorPaletteManager.tsx  # Palette quantization (GameBoy, Cyberpunk, etc.)
│   │   ├── CursorMagicEffects.tsx   # Procedural animation generator
│   │   ├── EasingEditor.tsx         # Bezier & curve visualization
│   │   ├── ExportModal.tsx          # Multi-format export dialog (.ANI, .CUR, .GIF, .ZIP)
│   │   ├── GeminiAssistant.tsx      # AI idea generation & suggestions
│   │   ├── GlassPanel.tsx           # Glassmorphism container wrapper
│   │   ├── Inspector.tsx            # Hotspot, dimensions, and metadata inspector
│   │   ├── MobileTouchSimulator.tsx # Mobile cursor emulation
│   │   ├── PreviewCanvas.tsx        # High-zoom canvas with pixel grid & hotspot crosshair
│   │   ├── Timeline.tsx             # Frame timeline scrubber with drag & drop
│   │   ├── UploadZone.tsx           # Drag & drop upload area for files
│   │   └── VideoToFramesExtractorModal.tsx # Video-to-Cursor extraction studio
│   ├── engine/                      # Core Binary & Graphics Processing
│   │   ├── aniWriter.ts             # RIFF/ACON .ANI binary generator
│   │   ├── curParser.ts             # .CUR and .ICO binary parser
│   │   ├── curWriter.ts             # .CUR binary generator
│   │   └── effects/                 # Procedural mathematical transformations
│   ├── services/
│   │   └── videoProcessor.ts        # HTML5 Video + Canvas frame sampling & chroma keying
│   ├── pages/
│   │   ├── Dashboard.tsx            # User projects & recent files
│   │   ├── Editor.tsx               # Main studio workspace
│   │   ├── Landing.tsx              # Feature walkthrough & hero showcase
│   │   └── Settings.tsx             # Studio preferences & hotkey configuration
│   ├── db/                          # Firebase Firestore configuration & helpers
│   ├── types.ts                     # Core TypeScript type definitions
│   ├── App.tsx                      # Root application router & state provider
│   └── main.tsx                     # React client mounting entry
├── public/                          # Static assets and application icons
├── server.ts                        # Express server entry point (port 3000)
├── package.json                     # Project manifest and scripts
├── tsconfig.json                    # TypeScript compiler configuration
└── vite.config.ts                   # Vite configuration with Tailwind CSS plugin
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun** / **yarn**

### Installation

1. **Clone or open the repository**:
   ```bash
   git clone <repo-url>
   cd react-example
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will start on **`http://localhost:3000`**.

4. **Production Build**:
   ```bash
   npm run build
   ```
   To test the production server:
   ```bash
   npm run start
   ```

---

## 🛠️ Step-by-Step Usage Guide

### How to Convert a Video to an Animated Cursor (`.ANI`):
1. Launch the app and click the **"🎥 Video to Cursor"** button on the toolbar or upload screen.
2. Either drag-and-drop a video file (MP4, WebM, MOV) or enter a direct video URL.
3. Use the **Trimmer Sliders** to mark the starting point and ending point of the animation (recommended: 0.5s to 2s for optimal cursor file size).
4. Select your desired frame count (e.g., 16 frames) and resolution (32x32 or 48x48).
5. If the video has a solid background (green, black, white), enable **Chroma Key / Background Removal** and adjust the tolerance slider until the preview displays a clean transparent background.
6. Optional: Turn on **Neon Glow** or **Pixelate** for retro effects.
7. Click **"Extract & Load into Timeline"**.
8. Set the **Hotspot** position (where the click registers) by clicking on the preview frame or choosing "Top-Left (0, 0)".
9. Click **"Export"** -> **"Windows Animated Cursor (.ani)"** to download your ready-to-use cursor!

### How to apply `.ANI` cursors in Windows 10 & 11:
1. Open Windows **Settings** (`Win + I`).
2. Navigate to **Bluetooth & devices** > **Mouse** > **Additional mouse settings**.
3. In the Mouse Properties window, select the **Pointers** tab.
4. Highlight the pointer state you want to change (e.g., *Normal Select* or *Working in Background*).
5. Click **Browse...**, select your exported `.ani` or `.cur` file, click **Open**, and then click **Apply**!

---

## 📄 License & Credits

Built with ❤️ using React 19, TypeScript, and Tailwind CSS.
Free for personal and commercial cursor creation.
