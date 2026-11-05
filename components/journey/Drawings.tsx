import type { ReactNode } from "react";
import type { DrawingId } from "@/content/site";

/**
 * Scene 5 line drawings, one per interest. Every stroke has pathLength="1", so the
 * timeline can draw it in by moving stroke-dashoffset from 1 to 0.
 * All in a 100 × 100 box, centered on its slot.
 */
export function Drawing({ id }: { id: DrawingId }) {
  return (
    <svg className="drawing-art" viewBox="0 0 100 100" aria-hidden focusable="false">
      {SHAPES[id]}
    </svg>
  );
}

const s = { className: "stroke", pathLength: 1 } as const;

const SHAPES: Record<DrawingId, ReactNode> = {
  // A shot: the ball, its parabola, and the hoop.
  basketball: (
    <>
      <circle {...s} cx="12" cy="84" r="6" />
      <path {...s} d="M12 78 Q 46 -18 80 42" />
      <path {...s} d="M95 24 V 52" />
      <path {...s} d="M76 42 H 95" />
      <path {...s} d="M78 42 L 81 56 H 89 L 92 42" />
    </>
  ),
  // Placeholder until Mario picks the Velázquez painting to trace (see content/credits.ts):
  // a framed canvas on an easel.
  painting: (
    <>
      <rect {...s} x="22" y="10" width="56" height="50" />
      <rect {...s} x="28" y="16" width="44" height="38" />
      <path {...s} d="M36 60 L 26 92 M64 60 L 74 92 M50 60 V 90" />
      <path {...s} d="M30 78 H 70" />
    </>
  ),
  // An orbit; its center is left empty for the dot, which settles there.
  orbit: (
    <>
      <ellipse {...s} cx="50" cy="50" rx="42" ry="16" transform="rotate(-20 50 50)" />
      <circle {...s} cx="86.5" cy="44.5" r="3.5" />
      {/* Stands in for the dot where there is no canvas (reduced motion, no JavaScript). */}
      <circle className="orbit-center" cx="50" cy="50" r="5" />
    </>
  ),
  // An open book.
  book: (
    <>
      <path {...s} d="M50 28 C 40 22, 24 20, 10 25 V 76 C 24 71, 40 73, 50 80" />
      <path {...s} d="M50 28 C 60 22, 76 20, 90 25 V 76 C 76 71, 60 73, 50 80" />
      <path {...s} d="M50 28 V 80" />
      <path {...s} d="M18 38 C 27 35, 36 36, 44 39 M18 48 C 27 45, 36 46, 44 49 M18 58 C 27 55, 36 56, 44 59" />
      <path {...s} d="M56 39 C 64 36, 73 35, 82 38 M56 49 C 64 46, 73 45, 82 48 M56 59 C 64 56, 73 55, 82 58" />
    </>
  ),
  // Placeholder until Mario picks the Rodin sculpture to trace (see content/credits.ts):
  // an empty plinth.
  sculpture: (
    <>
      <path {...s} d="M28 90 H 72" />
      <path {...s} d="M32 90 V 64 H 68 V 90" />
      <path {...s} d="M28 64 H 72" />
      <path {...s} d="M38 64 V 58 H 62 V 64" />
    </>
  ),
};
