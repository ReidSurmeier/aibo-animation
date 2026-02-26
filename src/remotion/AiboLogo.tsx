import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
  AbsoluteFill,
} from "remotion";
import React from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Letter pieces — positions relative to the 1280×1280 canvas
const LETTERS = [
  {
    id: "a",
    src: `${BASE}/logo/a.png`,
    x: 251, y: 391, w: 199, h: 496,
    // Pull direction: editorial — letters slide along natural axes
    pullX: -180, pullY: -40, pullRotate: -4,
    // Slight stretch distortion during morph
    scaleX: 1.06, scaleY: 0.97,
  },
  {
    id: "i",
    src: `${BASE}/logo/i.png`,
    x: 390, y: 391, w: 190, h: 496,
    pullX: -50, pullY: -140, pullRotate: 2,
    scaleX: 0.98, scaleY: 1.04,
  },
  {
    id: "b",
    src: `${BASE}/logo/b.png`,
    x: 520, y: 391, w: 340, h: 496,
    pullX: 60, pullY: 90, pullRotate: -2,
    scaleX: 1.03, scaleY: 0.98,
  },
  {
    id: "o",
    src: `${BASE}/logo/o.png`,
    x: 790, y: 391, w: 240, h: 496,
    pullX: 190, pullY: -30, pullRotate: 5,
    scaleX: 0.97, scaleY: 1.05,
  },
];

const CANVAS = 1280;
const LOGO_SCALE = 0.55;

// Slow editorial easing — matches the Are.na collection aesthetic
const EDITORIAL_EASE = Easing.bezier(0.45, 0, 0.55, 1);
const REVEAL_EASE = Easing.bezier(0.25, 0.1, 0.25, 1.0);

export const AiboLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // ─── Timeline (editorial pacing: slow, deliberate, with holds) ─────
  // 0 → 1.2s:   assembled, still (let the logo breathe)
  // 1.2 → 3.0s: slow separation (1.8s — letters slide apart, morphing)
  // 3.0 → 5.0s: apart, subtle drift (2.0s hold)
  // 5.0 → 6.8s: slow reassembly (1.8s — letters slide back, un-morph)
  // 6.8 → 8.0s: assembled, still (breathe again before loop)

  const holdStart = 0;
  const separateStart = Math.round(1.2 * fps);
  const separateEnd = Math.round(3.0 * fps);
  const driftEnd = Math.round(5.0 * fps);
  const reassembleEnd = Math.round(6.8 * fps);

  // Film grain overlay — subtle noise texture
  const grainSeed = frame * 7.3;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#EDEDEE",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: CANVAS * LOGO_SCALE,
          height: CANVAS * LOGO_SCALE,
        }}
      >
        {LETTERS.map((letter, idx) => {
          // Staggered delay — editorial cascade (80ms between letters)
          const staggerFrames = idx * Math.round(0.08 * fps);

          // ─── Separation progress (0 = together, 1 = fully apart) ───
          let progress = 0;

          if (frame >= separateStart && frame < separateEnd) {
            // Separating — slow ease-in-out over 1.8s with stagger
            const localFrame = frame - separateStart - staggerFrames;
            const duration = separateEnd - separateStart;
            progress = interpolate(localFrame, [0, duration], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: EDITORIAL_EASE,
            });
          } else if (frame >= separateEnd && frame < driftEnd) {
            progress = 1;
          } else if (frame >= driftEnd && frame < reassembleEnd) {
            // Reassembling — reverse with stagger
            const localFrame = frame - driftEnd - staggerFrames;
            const duration = reassembleEnd - driftEnd;
            const reassemble = interpolate(localFrame, [0, duration], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: EDITORIAL_EASE,
            });
            progress = 1 - reassemble;
          } else if (frame >= reassembleEnd) {
            progress = 0;
          }

          // ─── Subtle drift while apart (slow sine, editorial) ───
          let driftX = 0;
          let driftY = 0;
          if (frame >= separateEnd && frame < driftEnd) {
            const t = (frame - separateEnd) / fps;
            driftX = Math.sin(t * 0.8 + idx * 2.1) * 5;
            driftY = Math.cos(t * 0.6 + idx * 1.4) * 3;
          }

          // ─── Computed transforms ───
          const tx = progress * letter.pullX + driftX;
          const ty = progress * letter.pullY + driftY;
          const rotate = progress * letter.pullRotate;

          // Morphing: slight scale distortion at peak separation
          const sx = interpolate(progress, [0, 1], [1, letter.scaleX]);
          const sy = interpolate(progress, [0, 1], [1, letter.scaleY]);

          // Subtle opacity pulse during transition (letters slightly fade mid-morph)
          const opacity = interpolate(
            progress,
            [0, 0.3, 0.7, 1],
            [1, 0.85, 0.85, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <img
              key={letter.id}
              src={letter.src}
              style={{
                position: "absolute",
                left: letter.x * LOGO_SCALE,
                top: letter.y * LOGO_SCALE,
                width: letter.w * LOGO_SCALE,
                height: letter.h * LOGO_SCALE,
                transform: `translate(${tx}px, ${ty}px) rotate(${rotate}deg) scale(${sx}, ${sy})`,
                transformOrigin: "center center",
                opacity,
                imageRendering: "auto",
                // Subtle blur during movement (editorial transition feel)
                filter: progress > 0.05 && progress < 0.95
                  ? `blur(${interpolate(progress, [0.05, 0.5, 0.95], [0, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`
                  : "none",
              }}
            />
          );
        })}
      </div>

      {/* Subtle grain overlay — lo-fi materiality */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' seed='${Math.floor(grainSeed)}' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
          opacity: 0.035,
          mixBlendMode: "multiply",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
