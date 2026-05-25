import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.NEXT_STANDALONE_BUILD === "true" ? { output: "standalone" as const } : {}),
};

export default nextConfig;
