# Project Development Phases

## Phase 1: Pixel Grid & Painting Foundation
*   **Logical Canvas Mapping**: Setup the 2D HTML5 canvas element, binding mouse/touch events to map mouse locations to discrete, proportional grid coordinates.
*   **Drawing Tool Algorithms**: Integrate raw state toggles and implement Pencil drawing, smart interpolation lines, flood fills, and pixel erasure brush features.
*   **Base Styling**: Deploy the dark "Cosmic Slate" layout shell with structural frame cards and utility rails.

## Phase 2: Sequential Frame Timeline & Onion Skinning
*   **Linear Timeline Architecture**: Add deep frame-cloning state modifiers to duplicate, delete, and insert blank frames.
*   **Onion Skin Overlay Math**: Write custom off-screen blending code to project pre-frame and post-frame translucent visual shapes onto the main drawing board with customized alpha multipliers.
*   **Timeline UI**: Construct a scrollable slider widget presenting frame indexes, thumbnail canvas previews, and rapid select controls.

## Phase 3: Hotspot Anchoring & Basic Transforms
*   **Logical Origin Tracking**: Introduce a custom logical clickpoint state (`hotspotX`, `hotspotY`) visualizable on the grid as an target emblem.
*   **Interactive Hotspot Displacement**: Program interactive grab-and-drag mouse events to translate the hotspot coordinates in real-time.
*   **Transform Matrix**: Write rapid mirroring operations (`M` shortcut) that flips the active frame's painted pixels and its hotspot horizontally.

## Phase 4: Procedural FX Synthesis Engine
*   **Base FX Structure**: Develop a high-performance procedural frame pipeline in `src/engine/effects/index.ts`.
*   **30+ Advanced Math Algorithms**: Draft high-speed sinusoidal, polar, orbital, fractal, and physics-driven particle shaders to render complex animations around cursor silhouettes.
*   **Real-time Preview Galleries**: Integrate live-looping mini canvases in the side-drawer component to preview all 30+ effects instantly.

## Phase 5: Fast Keyboard Workspace Integration
*   **Central Key Hooks**: Build a centralized keyboard event listener window to intercept and parse user keystrokes (`H`, `P`, `S`, `F`, `E`, `M`, `[`/`]`, `Ctrl+Z`, `Ctrl+Y`).
*   **Help Sheet overlay**: Design an intuitive, easily accessible shortcuts cheat-sheet overlay.

## Phase 6: Custom Dimension Calibration & Final Export
*   **Custom Calibration Input**: Connect an intuitive validation parser (`4px` to `512px`) along with fixed preset buttons in the Inspector panel.
*   **Export Packing**: Bundle the completed frames and meta indicators into downloadable structures suitable for Windows `.ani` packaging or local project archives.
