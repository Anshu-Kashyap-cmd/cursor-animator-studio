# User Interface & Visual Design System (Design)

## 1. Aesthetic Identity (Cosmic Charcoal Theme)
The workspace employs an immersive dark, high-contrast, professional-grade slate interface. The theme is engineered to minimize eye strain and establish supreme focus during long pixel-editing sessions.

*   **Primary Background**: Deep Obsidian Carbon (`#0F172A` / `#1C1512`)
*   **Secondary Cards & Panels**: Dark Charcoal Slate (`#1E293B` / `#2D231E`)
*   **Primary Branding Accent**: Sunlit Ember Orange (`#E8793A`)
*   **Muted Text & Indicators**: Warm Autumn Sand (`#B8ADA3` / `#F3EDE7`)

```
+--------------------------------------------------------+
|  LOGO  [ Pencil ] [ Bucket ] [ Eraser ] [ Hotspot ]    |
+--------------------------------------------------------+
|  [Drawing Canvas Grid]                 | [Inspector]   |
|                                        |  - Custom px  |
|                                        |  - Presets    |
|                                        |  - Colors     |
+--------------------------------------------------------+
|  [Sequencer Timeline Strip]                            |
+--------------------------------------------------------+
```

## 2. Interactive States & Visual Affordances
*   **Active Tool Hover Effects**: All toolbar controls animate using responsive translation shifts (moving upwards by `2px` via CSS transitions) and highlight active modes with subtle glowing orange outlines (`ring-2 ring-[#E8793A]`).
*   **Logical Hotspot Indicator**: Styled as a highly contrasting neon concentric target crosshair with active sizing pulses.
*   **Interactive Grid Cells**: Cell bounds display sub-pixel borders that gracefully scale based on the zoom ratio. Hovering over a cell projects a semi-transparent preview of the active color to let creators sketch with pixel precision.

## 3. Typography System
*   **Display Headings & Titles**: Styled in clean, high-contrast **Inter** with medium tracking and heavy weights (`font-sans font-semibold tracking-tight text-[#F3EDE7]`).
*   **Data, Metrics, & Shortcuts**: Monospaced typography using **JetBrains Mono** (`font-mono text-xs`) for coordinates, dimensions, frame indexes, and keyboard shortcut chips.

## 4. Layout Architecture
*   **Responsive Flex Panels**: The layout divides the screen into four clean modules (Toolbar, Painting Canvas, Sequencer Timeline, and Inspector). Panels collapse gracefully on compact tablets using custom responsive triggers.
*   **Generous Negative Space**: Grid elements and card groups are padded with clear borders to avoid visual clutter.
