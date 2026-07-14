# System Architecture Document - Animated Cursor Creator

## 1. Modular System Design
The application is structured as a client-side Single Page Application utilizing **React (TypeScript)** and **Vite**, backed by a custom **Express server** (configured for full-stack compatibility or deployment).

```
[ React UI Components ]  <--->  [ Central State Engine (Editor State) ]
         |                                      |
         | (Updates Canvas Data)                | (Dispatches Undo/Redo)
         v                                      v
[ Drawing Canvas Component ]            [ History Tracker (UndoStack) ]
         |
         | (Generates Frame Previews)
         v
[ Custom 2D Canvas Engine ]  <--->  [ Procedural Effect Generators ]
```

## 2. Component Hierarchy & Module Mapping
*   `src/main.tsx`: Standard SPA entry-point.
*   `src/App.tsx`: Central shell, housing router configurations and general structure.
*   `src/pages/Editor.tsx`: Main workspace page controlling the active layout, coordinating canvas interactions, timeline synchronizations, and tool changes.
*   `src/components/DrawingCanvas.tsx`: Core drawing board. Handles raw pointer events (down, move, up) and executes raster-level modifications based on active brush rules (Pencil, Smart Smoothing, Bucket Fill, Eraser).
*   `src/components/Timeline.tsx`: Frame-level linear buffer sequencer. Manages duplicate, delete, and add events.
*   `src/components/Inspector.tsx`: Controls dimensions presets, custom exact-px scaling inputs, RGB color selection, and hotspot translation logic.
*   `src/components/EffectGallery.tsx`: A side-drawer catalog displaying real-time previews of the 30+ custom procedural animation filters.
*   `src/engine/effects/index.ts`: The central algorithm file. Hosts customized math functions (`sin`, `cos`, `pow`, pseudo-random seeding) and 2D canvas drawing routines to render real-time effects on active pixels.

## 3. Pixel Modification Pipeline (DrawingCanvas)
All drawing is rendered to an HTML5 `<canvas>` using the standard 2D Context (`CanvasRenderingContext2D`).
1.  **Input Translation**: Coordinates are captured relative to client bounds and mapped dynamically to the logical size of the grid (e.g., translating `clientX` relative to bounding rectangles into logical coordinates `x: [0..width], y: [0..height]`).
2.  **Painting Algorithm**:
    *   **Pencil**: Modifies a 1D pixel index: `index = y * width + x` in the canvas frame's flat pixel array.
    *   **Smart Brush**: Applies a cardinal spline or linear interpolation between the current and last pointer position to guarantee unbroken lines during fast drags, followed by a slight anti-aliasing feathering step.
    *   **Flood Fill**: Classical queue-based flood fill to update contiguous areas of matching colors:
        ```typescript
        const targetColor = getPixel(x, y);
        const queue = [[x, y]];
        while (queue.length > 0) {
          const [cx, cy] = queue.shift()!;
          if (getPixel(cx, cy) === targetColor) {
            setPixel(cx, cy, replacementColor);
            queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
          }
        }
        ```

## 4. Animation Frame Synthesis & Effect Loop
The preview loop utilizes the native browser `requestAnimationFrame` (or an optimized `setInterval` sync) inside custom preview hooks:
1.  **Background Buffering**: A hidden off-screen canvas is populated with the static frame's pixel data.
2.  **Effect Layer Injection**: Depending on the active effect, the off-screen canvas is drawn onto the display canvas. Then, the specific 2D procedural graphics calculations are applied relative to the computed logical `hotspot` coordinates.
3.  **Onion Skin Overlay**: When drawing adjacent frame ghosts, the system blends them onto the display with specific alpha levels:
    *   $\text{Opacity}_{\text{prev}} = \text{BaseOpacity} \times 0.5$
    *   $\text{Opacity}_{\text{next}} = \text{BaseOpacity} \times 0.35$

## 5. History Engine (Undo/Redo State)
State snapshots are managed using linear twin stacks:
*   `undoStack: Frame[][]` (LIFO)
*   `redoStack: Frame[][]` (LIFO)
Every stroke completion pushes the preceding frames into the `undoStack`, and truncates the `redoStack` to guarantee a linear history timeline.
