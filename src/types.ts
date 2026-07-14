import { EasingType } from "./engine/effects/easing.ts";
import { EffectPreset } from "./engine/effects/index.ts";

export interface ProjectFrame {
  frame_index: number;
  duration_ms: number;
  width: number;
  height: number;
  hotspot_x: number;
  hotspot_y: number;
  image_data: string; // Base64 PNG dataUrl
}

export interface ProjectData {
  id: string;
  user_id?: string | null;
  name: string;
  mode: "auto" | "manual";
  frame_count: number;
  total_duration_ms: number;
  effect_preset: EffectPreset | null;
  easing: EasingType;
  hotspot_x: number;
  hotspot_y: number;
  created_at: string;
  updated_at: string;
  frames: ProjectFrame[];
  palette?: string[];
}

export interface ExportHistoryEntry {
  id: string;
  project_id: string;
  project_name: string;
  user_id: string | null;
  exported_format: "ani" | "cur" | "gif" | "zip";
  file_size_bytes: number;
  total_duration_ms: number;
  exported_at: string;
  image_data: string; // Thumbnail data URL
}
