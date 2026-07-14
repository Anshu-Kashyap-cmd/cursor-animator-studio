# Project Coding Standards & Guidelines (Rules)

To maintain a pristine, highly performant, and reliable full-stack application, developers must strictly adhere to the following rules:

## 1. Scope Discipline (Absolute Priority Directive)
*   **Build Exactly What is Described**: Treat the user's explicit instructions as both the floor and the absolute ceiling of functional scope. Do not inject unsolicited features, sidebar sub-views, or mock components to "improve" the app.
*   **No Technical Larping (Anti-AI-Slop)**: Strictly avoid decorative infrastructure indicators. Do NOT include mock log displays, server connection status badges, port configurations, ping numbers, or custom system credits in the page margins or rails.
*   **Literal and Humble Naming**: Name all buttons, fields, and titles using direct, objective human names (e.g., "Clock", "Download", "Grid Lines") instead of pseudo-futuristic labels ("Chronos Meter", "Sync Portal", etc.).
*   **No Unrequested Theme Selectors**: The workspace utilizes a singular, beautifully configured **Cosmic Charcoal & Warm Slate Dark Theme** paired with clean orange accent highlights (`#E8793A`). Do not build secondary theme-switching buttons or visual preset overrides unless explicitly requested.

## 2. React state Management & Re-renders
*   **No State Modification in Component Body**: Never change, re-assign, or mutate states during the component render cycle. All state modifiers must be contained inside event listeners or `useEffect` hooks.
*   **Stabilized Dependency Arrays**: Avoid using raw arrays, object literals, or inline functions inside a `useEffect` dependency array. If necessary, memoize them via `useMemo` or `useCallback`.
*   **Type Imports**: Put all import statements at the absolute top of the files. Use clean named imports and avoid standard destructuring inside the import statement. Do not use `import type` to load enums.

## 3. Styling & Aesthetics (Tailwind CSS)
*   **Tailwind Utilities Only**: All styles must be styled directly via inline utility classes. Do not use external `.css` files, inline HTML `style={}` variables, or custom styled-component modules.
*   **Font Definitions**:
    *   **Primary UI**: Standard clean `Inter` (sans-serif) font.
    *   **Technical / Data**: Precise `JetBrains Mono` or `Fira Code` (monospace) for coordinate numbers, size px, frames, and shortcut keys.
*   **Responsive prefix rules**: Use mobile-first prefixes (`sm:`, `md:`, `lg:`) to control visual scaling on smaller viewports. Ensure touch targets are at least `44px` on mobile wrappers.

## 4. DOM Unique Identifiers
*   Every critical interactive element (including pixel editing canvases, tool buttons, file dialog forms, timeline nodes, and configuration inputs) **MUST** feature a unique, semantic `id` attribute. This permits clean automated tests, styling, and direct scripting.
