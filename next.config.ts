import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/aibo-animation",
  assetPrefix: "/aibo-animation/",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
