import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  AbsoluteFill,
} from "remotion";
import React from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

/*
 * Clover logo animation — pinwheel style
 * Reference: curved-arrow pinwheel GIF (contract/rotate → explode → reform)
 *
 * 4 pieces: top-left leaf, top-right leaf, bottom-right leaf, stem
 * Each piece has a "home" position and an "exploded" position
 *
 * Cycle: assembled → contract+rotate → explode outward → hold → slide back → assembled
 */

// Original image: 498×488, junction at ~(308, 203)
// Piece crop coordinates (from the full image)
const PIECES = [
  {
    id: "tl",
    src: `${BASE}/logo/tl.png`,
    // Crop region in original image
    cropX: 74, cropY: 18, w: 264, h: 215,
    // Explode direction (angle in degrees from center, distance)
    explodeAngle: -135, // upper-left
    explodeDist: 120,
    // Individual rotation during explode
    spinDeg: -25,
  },
  {
    id: "tr",
    src: `${BASE}/logo/tr.png`,
    cropX: 278, cropY: 18, w: 224, h: 235,
    explodeAngle: -45, // upper-right
    explodeDist: 110,
    spinDeg: 25,
  },
  {
    id: "br",
    src: `${BASE}/logo/br.png`,
    cropX: 278, cropY: 183, w: 224, h: 274,
    explodeAngle: 30, // lower-right
    explodeDist: 100,
    spinDeg: 20,
  },
  {
    id: "stem",
    src: `${BASE}/logo/stem.png`,
    cropX: 74, cropY: 183, w: 264, h: 274,
    explodeAngle: 200, // lower-left (stem direction)
    explodeDist: 110,
    spinDeg: -15,
  },
];

const IMG_W = 498;
const IMG_H = 488;
const DISPLAY_SCALE = 1.1; // scale up for visibility

// Easing curves
const SMOOTH = Easing.bezier(0.45, 0, 0.55, 1); // editorial ease-in-out
const SNAP = Easing.bezier(0.0, 0, 0.2, 1);      // punchy snap-in

export const AiboLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ─── Timeline (matching pinwheel reference) ────────────────────────
  // Phase 1: 0 → 0.6s    — assembled, still
  // Phase 2: 0.6 → 1.4s  — contract toward center + rotate CW (~45°)
  // Phase 3: 1.4 → 2.2s  — explode outward to corners + pieces spin
  // Phase 4: 2.2 → 3.0s  — hold apart (subtle float)
  // Phase 5: 3.0 → 3.8s  — reform (slide back in, reverse spin)
  // Phase 6: 3.8 → 4.4s  — settle (slight overshoot on reassembly)
  //                         then hold assembled → loop

  const t1 = Math.round(0.6 * fps);  // contract start
  const t2 = Math.round(1.4 * fps);  // contract end / explode start
  const t3 = Math.round(2.2 * fps);  // explode end / hold start
  const t4 = Math.round(3.0 * fps);  // hold end / reform start
  const t5 = Math.round(3.8 * fps);  // reform end
  const t6 = Math.round(4.4 * fps);  // settle end

  // Global rotation (entire assembly rotates during contract phase)
  let globalRotation = 0;
  if (frame >= t1 && frame < t2) {
    globalRotation = interpolate(frame, [t1, t2], [0, 45], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SMOOTH,
    });
  } else if (frame >= t2 && frame < t3) {
    // Continue rotating during explode
    globalRotation = interpolate(frame, [t2, t3], [45, 90], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SMOOTH,
    });
  } else if (frame >= t3 && frame < t4) {
    globalRotation = 90; // hold
  } else if (frame >= t4 && frame < t5) {
    // Rotate back during reform
    globalRotation = interpolate(frame, [t4, t5], [90, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SMOOTH,
    });
  } else if (frame >= t5) {
    globalRotation = 0;
  }

  // Global scale (contract then expand)
  let globalScale = 1;
  if (frame >= t1 && frame < t2) {
    globalScale = interpolate(frame, [t1, t2], [1, 0.7], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SMOOTH,
    });
  } else if (frame >= t2 && frame < t3) {
    globalScale = interpolate(frame, [t2, t3], [0.7, 0.85], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SMOOTH,
    });
  } else if (frame >= t3 && frame < t4) {
    globalScale = 0.85;
  } else if (frame >= t4 && frame < t5) {
    globalScale = interpolate(frame, [t4, t5], [0.85, 1], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SMOOTH,
    });
  } else if (frame >= t5 && frame < t6) {
    // Slight overshoot settle
    globalScale = interpolate(frame, [t5, t6], [1, 1], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    });
  }

  // Film grain seed
  const grainSeed = frame * 7.3;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#F5F0E8", // warm cream like the original logo bg
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: IMG_W * DISPLAY_SCALE,
          height: IMG_H * DISPLAY_SCALE,
          transform: `rotate(${globalRotation}deg) scale(${globalScale})`,
          transformOrigin: "center center",
        }}
      >
        {PIECES.map((piece, idx) => {
          // Stagger: 2 frames between each piece
          const stagger = idx * 2;

          // ─── Explode progress (0 = home, 1 = fully exploded) ───
          let explode = 0;
          if (frame >= t2 && frame < t3) {
            explode = interpolate(frame - stagger, [t2, t3], [0, 1], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SMOOTH,
            });
          } else if (frame >= t3 && frame < t4) {
            explode = 1;
          } else if (frame >= t4 && frame < t5) {
            explode = interpolate(frame - stagger, [t4, t5], [1, 0], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SNAP,
            });
          } else if (frame >= t5) {
            explode = 0;
          }

          // Compute explode offset
          const rad = (piece.explodeAngle * Math.PI) / 180;
          const ex = explode * piece.explodeDist * Math.cos(rad);
          const ey = explode * piece.explodeDist * Math.sin(rad);

          // Individual piece rotation
          const pieceRotate = explode * piece.spinDeg;

          // Subtle float while holding apart
          let floatX = 0, floatY = 0;
          if (frame >= t3 && frame < t4) {
            const ft = (frame - t3) / fps;
            floatX = Math.sin(ft * 1.2 + idx * 1.8) * 3;
            floatY = Math.cos(ft * 0.9 + idx * 2.2) * 2;
          }

          // Opacity: slight fade mid-explode
          const opacity = interpolate(explode, [0, 0.5, 1], [1, 0.88, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });

          return (
            <img
              key={piece.id}
              src={piece.src}
              style={{
                position: "absolute",
                left: piece.cropX * DISPLAY_SCALE,
                top: piece.cropY * DISPLAY_SCALE,
                width: piece.w * DISPLAY_SCALE,
                height: piece.h * DISPLAY_SCALE,
                transform: `translate(${ex + floatX}px, ${ey + floatY}px) rotate(${pieceRotate}deg)`,
                transformOrigin: "center center",
                opacity,
                imageRendering: "auto",
              }}
            />
          );
        })}
      </div>

      {/* Subtle grain */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' seed='${Math.floor(grainSeed)}' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
          opacity: 0.03,
          mixBlendMode: "multiply",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
