import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  AbsoluteFill,
} from "remotion";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Letter piece positions relative to the 1280x1280 canvas
const LETTERS = [
  {
    id: "a",
    src: `${BASE}/logo/a.png`,
    x: 251, y: 391, w: 199, h: 496,
    pullX: -120, pullY: -60, pullRotate: -12,
  },
  {
    id: "i",
    src: `${BASE}/logo/i.png`,
    x: 390, y: 391, w: 190, h: 496,
    pullX: -30, pullY: -100, pullRotate: 8,
  },
  {
    id: "b",
    src: `${BASE}/logo/b.png`,
    x: 520, y: 391, w: 340, h: 496,
    pullX: 40, pullY: 70, pullRotate: -6,
  },
  {
    id: "o",
    src: `${BASE}/logo/o.png`,
    x: 790, y: 391, w: 240, h: 496,
    pullX: 130, pullY: -40, pullRotate: 15,
  },
];

const CANVAS = 1280;
const LOGO_SCALE = 0.55;

export const AiboLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Timeline:
  // 0 → 0.8s: assembled (still)
  // 0.8s → 1.6s: pull apart (spring out)
  // 1.6s → 2.8s: floating apart (hold)
  // 2.8s → 3.8s: snap back together (spring in)
  // 3.8s → end: assembled (still)

  const assembledEnd = Math.round(0.8 * fps);
  const pullEnd = Math.round(1.6 * fps);
  const holdEnd = Math.round(2.8 * fps);
  const snapEnd = Math.round(3.8 * fps);

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
          // Stagger each letter slightly
          const stagger = idx * 3;

          // Pull-apart spring (0 = assembled, 1 = fully apart)
          let pullProgress = 0;

          if (frame >= assembledEnd && frame < pullEnd) {
            // Springing out
            pullProgress = spring({
              frame: frame - assembledEnd - stagger,
              fps,
              config: { mass: 0.8, damping: 12, stiffness: 80 },
            });
          } else if (frame >= pullEnd && frame < holdEnd) {
            // Fully apart — add gentle float
            pullProgress = 1;
          } else if (frame >= holdEnd && frame < snapEnd) {
            // Snapping back — reverse spring
            const snapProgress = spring({
              frame: frame - holdEnd - stagger,
              fps,
              config: { mass: 0.6, damping: 14, stiffness: 120 },
            });
            pullProgress = 1 - snapProgress;
          } else if (frame >= snapEnd) {
            pullProgress = 0;
          }

          // Gentle floating motion while apart
          let floatX = 0;
          let floatY = 0;
          if (frame >= pullEnd && frame < holdEnd) {
            const floatPhase = (frame - pullEnd) / fps;
            floatX = Math.sin(floatPhase * 2.5 + idx * 1.5) * 8;
            floatY = Math.cos(floatPhase * 2.0 + idx * 0.8) * 6;
          }

          const tx = pullProgress * letter.pullX + floatX;
          const ty = pullProgress * letter.pullY + floatY;
          const rotate = pullProgress * letter.pullRotate;

          // Subtle scale pulse on snap-back
          let scale = 1;
          if (frame >= holdEnd && frame < snapEnd + Math.round(0.3 * fps)) {
            const bounceFrame = frame - holdEnd - stagger;
            const bounce = spring({
              frame: bounceFrame,
              fps,
              config: { mass: 0.5, damping: 8, stiffness: 150 },
            });
            scale = 1 + (1 - bounce) * 0.05;
          }

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
                transform: `translate(${tx}px, ${ty}px) rotate(${rotate}deg) scale(${scale})`,
                transformOrigin: "center center",
                imageRendering: "auto",
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
