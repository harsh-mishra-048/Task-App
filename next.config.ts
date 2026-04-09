import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  basePath: "/task_app",
  assetPrefix: "/task_app",
};

export default nextConfig;
