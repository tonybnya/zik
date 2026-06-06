import { TapeReel } from "./TapeReel";
import { TapeWindow } from "./TapeWindow";
import { CASSETTE_GEOMETRY } from "./types";

interface CassetteBodyProps {
  playing: boolean;
  reduced: boolean;
}

const STRIPE = ["#d6552e", "#ef8b3c", "#e8a83c", "#b9824e"];

/**
 * The cassette shell as scalable SVG (Task 6.2), proportioned after
 * `cassette.png`: dark rounded shell, cream label plate, warm retro stripe,
 * twin spoked reels over a tape window, corner screws, and a bottom lip. Tinted
 * to the ZIK warm palette. Fills its container width; height follows the ratio.
 */
export function CassetteBody({ playing, reduced }: CassetteBodyProps) {
  const { viewWidth, viewHeight, reel, window } = CASSETTE_GEOMETRY;
  const screws = [
    { cx: 24, cy: 24 },
    { cx: 336, cy: 24 },
    { cx: 24, cy: 178 },
    { cx: 336, cy: 178 },
  ];
  const stripeTop = 95;

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      className="block h-auto w-full"
      role="img"
      aria-label="Cassette tape player"
    >
      <defs>
        <linearGradient id="shell-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a342f" />
          <stop offset="1" stopColor="#2a2522" />
        </linearGradient>
      </defs>

      {/* Bottom insertion lip (behind the body) */}
      <path d="M118 184 H242 L226 220 H134 Z" fill="#241f1c" />

      {/* Shell */}
      <rect
        x={8}
        y={8}
        width={344}
        height={180}
        rx={20}
        fill="url(#shell-grad)"
        stroke="#1e1a17"
        strokeWidth={2}
      />
      <rect
        x={16}
        y={16}
        width={328}
        height={164}
        rx={15}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={2}
      />

      {/* Label plate */}
      <rect x={44} y={24} width={272} height={52} rx={10} fill="#f3e7cd" stroke="#cbb892" strokeWidth={1.5} />

      {/* Warm retro stripe band (behind reels/window) */}
      {STRIPE.map((color, i) => (
        <rect
          key={`stripe-${i}`}
          x={28}
          y={stripeTop + i * 6}
          width={304}
          height={6}
          fill={color}
        />
      ))}

      <TapeWindow
        x={window.x}
        y={window.y}
        width={window.width}
        height={window.height}
        playing={playing}
        reduced={reduced}
      />

      <TapeReel
        cx={reel.leftCx}
        cy={reel.cy}
        radius={reel.radius}
        playing={playing}
        reduced={reduced}
        duration={2.6}
      />
      <TapeReel
        cx={reel.rightCx}
        cy={reel.cy}
        radius={reel.radius}
        playing={playing}
        reduced={reduced}
        duration={3.1}
      />

      {/* Corner screws */}
      {screws.map((s, i) => (
        <g key={`screw-${i}`}>
          <circle cx={s.cx} cy={s.cy} r={4.5} fill="#1b1714" />
          <circle cx={s.cx} cy={s.cy} r={2.2} fill="#000" opacity={0.5} />
        </g>
      ))}

      {/* Brand mark */}
      <text
        x={viewWidth / 2}
        y={172}
        textAnchor="middle"
        fill="#cbb491"
        fontFamily='"JetBrains Mono", monospace'
        fontSize={9}
        letterSpacing={3}
        opacity={0.7}
      >
        ZIK · TYPE II
      </text>
    </svg>
  );
}
