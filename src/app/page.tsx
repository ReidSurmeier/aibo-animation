"use client";

import dynamic from "next/dynamic";

const AnimationPlayer = dynamic(() => import("@/components/AnimationPlayer"), {
  ssr: false,
});

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#EDEDEE",
      }}
    >
      <AnimationPlayer />
    </main>
  );
}
