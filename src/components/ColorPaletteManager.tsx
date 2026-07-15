import React, { useState } from "react";
import { Palette, Plus, Trash2, Check, Paintbrush, HelpCircle, RefreshCw } from "lucide-react";

interface ColorPaletteManagerProps {
  palette: string[];
  onUpdatePalette: (newPalette: string[]) => void;
  selectedColor: string;
  onSelectColor: (color: string) => void;
  onApplyTintToAllFrames: (color: string) => void;
  isApplyingTint?: boolean;
}

const DEFAULT_PRESETS = [
  "#E8793A", // Signature Bronze-Orange
  "#6E5A7B", // Cosmic Violet
  "#38BDF8", // Ice Sky Blue
  "#10B981", // Emerald Green
  "#FBBF24", // Amber Gold
  "#EF4444", // Rose Red
  "#EC4899", // Neon Hot Pink
  "#FFFFFF", // Pure White
];

export const ColorPaletteManager: React.FC<ColorPaletteManagerProps> = ({
  palette,
  onUpdatePalette,
  selectedColor,
  onSelectColor,
  onApplyTintToAllFrames,
  isApplyingTint = false,
}) => {
  const [pickerColor, setPickerColor] = useState(selectedColor);
  const [showTooltip, setShowTooltip] = useState(false);

  const activePalette = palette.length > 0 ? palette : DEFAULT_PRESETS;

  const handleAddColor = () => {
    const formattedColor = pickerColor.toUpperCase();
    if (activePalette.includes(formattedColor)) return;
    const updated = [...activePalette, formattedColor];
    onUpdatePalette(updated);
    onSelectColor(formattedColor);
  };

  const handleRemoveColor = (e: React.MouseEvent, colorToRemove: string) => {
    e.stopPropagation();
    const updated = activePalette.filter((c) => c !== colorToRemove);
    onUpdatePalette(updated);
    
    // Fallback selection if active is removed
    if (selectedColor === colorToRemove) {
      onSelectColor(updated[0] || DEFAULT_PRESETS[0]);
    }
  };

  const handleResetToPresets = () => {
    onUpdatePalette(DEFAULT_PRESETS);
    onSelectColor(DEFAULT_PRESETS[0]);
  };

  return (
    <div className="flex flex-col space-y-4 p-5 rounded-2xl bg-white/[0.02] border border-white/10 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-[#F3EDE7]">
          <Palette className="w-4.5 h-4.5 text-[#E8793A]" />
          <h3 className="font-bold text-sm tracking-tight">Global Color Palette</h3>
        </div>
        <button
          onClick={handleResetToPresets}
          className="text-[10px] font-mono text-[#B8ADA3] hover:text-[#E8793A] transition-colors cursor-pointer flex items-center space-x-1"
          title="Reset to default palette swatches"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      <div className="h-px bg-white/10 w-full"></div>

      {/* Interactive Color Swatches Grid */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-[#B8ADA3] uppercase tracking-wider block">Saved Swatches</span>
        
        <div className="grid grid-cols-4 gap-2.5">
          {activePalette.map((color) => {
            const isSelected = selectedColor === color;
            return (
              <div
                key={color}
                onClick={() => onSelectColor(color)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onSelectColor(color);
                  }
                }}
                className={`group relative aspect-square rounded-xl cursor-pointer transition-all border flex items-center justify-center hover:scale-[1.08] ${
                  isSelected
                    ? "border-white scale-[1.04] shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                    : "border-white/10 hover:border-white/30"
                }`}
                style={{ backgroundColor: color }}
                title={`Select ${color}`}
              >
                {/* Active Checkmark */}
                {isSelected && (
                  <div className="p-0.5 rounded-full bg-black/45 backdrop-blur-sm border border-white/20">
                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  </div>
                )}

                {/* Remove button (Only appears on hover if not default presets or if custom is added) */}
                <button
                  onClick={(e) => handleRemoveColor(e, color)}
                  className="absolute -top-1 -right-1 p-0.5 rounded-full bg-red-600/95 hover:bg-red-500 border border-white/15 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer shadow-md"
                  title="Remove swatch"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Color Input Controls */}
      <div className="bg-black/40 p-3.5 rounded-xl border border-white/5 space-y-3 shadow-inner">
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Create Custom Swatch</span>
        
        <div className="flex items-center space-x-2.5">
          {/* Circular color input preview clicker */}
          <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/15 cursor-pointer shrink-0">
            <input
              type="color"
              value={pickerColor}
              onChange={(e) => setPickerColor(e.target.value)}
              className="absolute inset-0 w-[140%] h-[140%] -translate-x-[15%] -translate-y-[15%] cursor-pointer border-0 p-0"
            />
          </div>

          {/* HEX Input Field */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={pickerColor}
              onChange={(e) => setPickerColor(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-xs font-mono text-[#F3EDE7] focus:border-[#E8793A] focus:outline-none focus:ring-1 focus:ring-[#E8793A]/50"
              placeholder="#E8793A"
            />
          </div>

          {/* Add swatch trigger */}
          <button
            onClick={handleAddColor}
            className="p-2 py-1.5 rounded-lg bg-[#E8793A] hover:bg-[#F2925C] text-neutral-900 font-bold text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 flex items-center space-x-1"
            title="Save color to palette"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Swatch Actions Block (Bake consistent color into all manual frames) */}
      <div className="pt-2">
        <button
          onClick={() => onApplyTintToAllFrames(selectedColor)}
          disabled={isApplyingTint}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg bg-[#E8793A]/10 hover:bg-[#E8793A]/20 text-[#E8793A] text-xs font-bold border border-[#E8793A]/20 hover:border-[#E8793A]/40 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-sm"
        >
          {isApplyingTint ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-[#E8793A]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Recoloring frames...</span>
            </>
          ) : (
            <>
              <Paintbrush className="w-3.5 h-3.5" />
              <span>Apply Selected Color to All Frames</span>
            </>
          )}
        </button>
        
        <p className="text-[9px] text-[#B8ADA3] leading-relaxed mt-2 italic text-center">
          Consistently tints all frame pixels in the animation using the active swatch.
        </p>
      </div>

      {/* Auto-bind status info */}
      <div className="p-3 rounded-lg bg-white/[0.01] border border-white/5 flex items-start space-x-2">
        <div className="bg-[#6E5A7B]/10 p-1.5 rounded border border-[#6E5A7B]/20 text-neutral-300">
          <HelpCircle className="w-3.5 h-3.5 text-[#E8793A]" />
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-white block">Auto-Bound to Preset Effects</span>
          <p className="text-[9px] text-[#B8ADA3] leading-normal">
            Selected swatch is bound to active glows, lightning strikes, particles, music waves, lasers, and trails!
          </p>
        </div>
      </div>
    </div>
  );
};
