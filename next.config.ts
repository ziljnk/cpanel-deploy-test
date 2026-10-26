import type { NextConfig } from "next";
import { commitId } from "./lib/commit";

const nextConfig: NextConfig = {
  /* config options here */
  deploymentId: commitId(),
  serverExternalPackages: ["mysql2", "drizzle-orm", "sharp"],
  experimental: {
    agentFeedback: true,
    cpus: 1,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
