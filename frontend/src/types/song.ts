/**
 * The canonical song shape used across the ZIK frontend (camelCase). The fetch
 * layer (Phase 8) maps the backend's snake_case JSON onto this type.
 */
export interface Song {
  id: number | string;
  title: string;
  artist: string;
  genre: string;
  moods: string[];
  bpm: number | null;
  externalUrl: string;
  coverUrl: string | null;
  audioUrl: string | null;
  /** True when surfaced by the Gemini recommender (Phase 10). */
  isAiPick?: boolean;
}
