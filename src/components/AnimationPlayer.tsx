"use client";

import { Player } from "@remotion/player";
import { AiboLogo } from "@/remotion/AiboLogo";

const FPS = 30;
const DURATION_SECONDS = 5;

export default function AnimationPlayer() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 640,
        aspectRatio: "1 / 1",
      }}
    >
      <Player
        component={AiboLogo}
        durationInFrames={DURATION_SECONDS * FPS}
        fps={FPS}
        compositionWidth={720}
        compositionHeight={720}
        loop
        autoPlay
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 0,
          overflow: "hidden",
        }}
        controls={false}
      />
    </div>
  );
}
