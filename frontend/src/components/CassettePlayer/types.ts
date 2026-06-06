/** Minimal song shape the cassette needs to render its label. */
export interface CassetteSong {
  title: string;
  artist: string;
}

export interface CassettePlayerProps {
  /** Whether the tape is playing (drives reel spin + ribbon motion). */
  isPlaying: boolean;
  /** Toggle play/pause. The page owns fetching the next song. */
  onPlayToggle: () => void;
  /** The current track, or `null` before the first play. */
  song?: CassetteSong | null;
  /** Show the loading spinner on the play button while a track is fetched. */
  isLoading?: boolean;
  className?: string;
}

/**
 * Shared SVG geometry. Overlays (label, play button) are positioned with the
 * same coordinate system expressed as percentages so they stay aligned at any
 * size. Keep this in sync with <CassetteBody>'s viewBox.
 */
export const CASSETTE_GEOMETRY = {
  viewWidth: 360,
  viewHeight: 232,
  reel: { leftCx: 112, rightCx: 248, cy: 120, radius: 38 },
  window: { x: 116, y: 98, width: 128, height: 44 },
} as const;
