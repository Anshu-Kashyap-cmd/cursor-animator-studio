# Project Requirements Document (PRD) - Animated Cursor Creator

## 1. Overview
The **Animated Cursor Creator** is a highly interactive, browser-based professional pixel-art workstation designed for drawing, previewing, and packaging animated mouse cursors (including Windows `.ani`/`.cur` standards). The workspace allows creators to sketch frame-by-frame cursor images manually or generate state-of-the-art procedural animation effects on top of their custom cursor silhouettes.

## 2. Core Functional Requirements

### 2.1 Drawing Canvas & Vector Workspace
*   **Grid System**: Responsive, pixel-perfect alignment grids with toggle switches (`G` shortcut).
*   **Drawing Tools**:
    *   **Pencil [P]**: Paints sharp, individual solid pixels on the active canvas.
    *   **Smart Pixel Brush [S]**: Performs advanced real-time stroke smoothing and curved anti-aliasing.
    *   **Paint Bucket [F / B]**: Classical 4-way flood fill algorithm to colored adjacent empty areas.
    *   **Eraser [E]**: Clears painted pixels to absolute transparency.
    *   **Hotspot Tool [H]**: Lets creators select and drag the cursor's logical clicking point (hotspot $x, y$).
*   **Interactive Controls**: Mouse click, drag, and release handlers to perform continuous painting/erasing strokes.

### 2.2 Dynamic Timeline & Onion Skinning
*   **Frame Control**: Users can create, delete, clone, rearrange, or select active frames.
*   **Onion Skinning**:
    *   **Previous Frame Ghosting [O]**: Overlay a semi-transparent guide of the immediate previous frame.
    *   **Next Frame Ghosting [Shift + O]**: Overlay a semi-transparent guide of the immediate next frame.
    *   **Opacity Calibration**: Adjust onion skin transparency in 5% increments using `+` (or `=`) and `-` keys.

### 2.3 Comprehensive Keyboard Shortcuts
The platform provides instant keyboard binds for advanced editing workflows:
*   **Tool Navigation**: `H` (Hotspot), `P` (Pencil), `S` (Smart Brush), `F`/`B` (Paint Bucket), `E` (Eraser).
*   **Timeline Navigation**: `ArrowLeft` or `[` to move backward, `ArrowRight` or `]` to move forward.
*   **Quick Transformations**: `M` to flip the active frame horizontally (mirror pixels and hotspot).
*   **History Control**: `Ctrl + Z` for undo, `Ctrl + Y` or `Ctrl + Shift + Z` for redo.
*   **Overlay Controls**: `G` for grid toggle, `?` (with Shift) to summon the shortcuts cheat sheet modal.

### 2.4 Inspector & Scale Controls
*   **Dimensions**: Custom input sizing (allowing any integer from 4px to 512px) as well as standardized presets (16px, 32px, 48px, 64px, 128px) which resize all active frames instantly to satisfy strict `.ani` platform compliance.
*   **Color Palette**: Custom hexadecimal selector + preset color chips for classic retro systems and modern themes.
*   **Coordinates Panel**: Real-time display of cursor position and active hotspot offsets.

### 2.5 Procedural FX Generator
Instead of manually drawing hundreds of frames, the system provides **30+ advanced procedural animation presets**:
1.  **Spin / Rotate**: Full 360° rotation loops.
2.  **Pulse / Breathe**: Organic sinusoidal scaling.
3.  **Glow Pulse**: Radiant radial bloom pulses.
4.  **Bounce & Squash**: Vertical physics with elastic landing.
5.  **Color Shift**: Infinite cycling of hue variables.
6.  **Particle Trail**: Magical sparkling stardust.
7.  **Shake / Jitter**: High-frequency energetic position offset.
8.  **Ember Flicker**: Upward floating thermal flame sparks.
9.  **Ripple Ring**: Harmonic water ripples.
10. **Snowflake Spin**: Crystalline frozen geometry.
11. **Rainbow Trail**: Spectral trailing colors.
12. **Thunder Strike**: White-hot static discharge arcs.
13. **Nebula Swirl**: Cosmic stellar dust orbits.
14. **Synthwave Neon**: Retro pink/cyan laser grids.
15. **RGB Split Glitch**: Displaced chromatic channels.
16. **Fairy Dust**: Spiraling golden glitter.
17. **Blood Drip**: Cascading gothic fluid drops.
18. **Music Beat Pulse**: Bouncing graphic equalizer bars.
19. **Fire & Ice Aura**: Polar hybrid element sparks.
20. **Cosmic Firestorm**: Roaring background flame sheets.
21. **Jade Dragon Spirit**: Emerald coiling trails.
22. **Cyberpunk Laser Beam**: White-hot laser pulses.
23. **Matrix Digital Rain**: Falling binary cascades.
24. **Heart Burst Bubble**: Floating bubble love emblems.
25. **Golden Orbit Ring**: Spinning planetary dust disks.
26. **Snowy Blizzard Drift**: Sideway winter gale squalls.
27. **Chroma Radial Wave**: Concentric radial spectrum waves.
28. **Quantum Spark Orbit**: Subatomic electron orbits.
29. **Retro Pixel Portal**: Pixelated spinning neon vortices.
30. **Neon Glitch Scanner**: Oscillating radar laser scanlines.
31. **Cosmic Supernova Blast**: Expanding stellar flares.
32. **Swirling Portal Vortex**: Spatial event-horizon whirlpools.
33. **Heartbeat Throb**: Rhythm-accurate double throb heartbeat.
34. **Plasma Forcefield**: Reactive energetic shield domes.
35. **Sakura Blossom Drift**: Wind-swept spinning flower petals.
36. **Electric Plasma Arc**: Chaotic cyan high-voltage snaps.
37. **Toxic Spore Cloud**: Bubbling green radioactive clouds.
38. **Tidal Wave Splash**: Hydrodynamic blue liquid splashes.
39. **Pixel Disintegration**: Drifting ash particle erosion.
40. **Volcanic Magma Core**: Incandescent core fires and lava embers.
41. **Celestial Golden Halo**: Divine spinning rings above hotspot.
42. **DNA Helix Orbit**: Double-stranded spinning genetic markers.
43. **Retro Disco Lights**: Dynamic flashing theatrical rays.
44. **Phantom Echoes**: Translucent historical trail ghosts.
45. **Haunted Vampire Bats**: Flapping chiroptera flight vectors.
46. **Cyber Binary Stream**: Matrix-style cascading bit columns.
47. **Fizzy Water Bubbles**: Effervescent expanding popping air pocket rings.
48. **Gravitational Swirl**: High-mass vortex pull effects.
49. **Fluttering Butterflies**: Delicate lepidoptera wing strokes.
50. **Wizard Spell Glyphs**: Rotating runic magic array circles.
51. **Prismatic Crystal Shards**: Refracted glass polygon bursts.
52. **Aurora Borealis Wave**: Floating neon plasma curtains.
53. **Steampunk Cog Gear**: Bronze rotating mechanical gears.

## 3. Non-Functional Requirements
*   **Client-Side High Performance**: 60fps frame calculations for canvas and preview renderings, using double-buffered Canvas API operations.
*   **Design Quality**: Distinctive dark workspace theme inspired by professional design tools (Cosmic Charcoal background with bright orange `#E8793A` branding accents).
*   **Accessibility**: High color contrast (AAA standard text ratios), clear visual indicators, and search-filterable keyboard layout lists.
