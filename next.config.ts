import type { NextConfig } from "next";

// Keep this file free of local imports. On glibc older than 2.29, Next falls
// back to the WASM SWC build, which compiles next.config.ts to ESM. An
// extensionless import such as ./lib/commit then fails to resolve. The app
// still reads the same env vars from lib/commit.ts.
const commitId =
  process.env.NEXT_PUBLIC_COMMIT?.trim() ||
  process.env.GIT_COMMIT?.trim() ||
  "unknown";

const nextConfig: NextConfig = {
  /* config options here */
  deploymentId: commitId,
  serverExternalPackages: ["mysql2", "drizzle-orm", "sharp"],
  env: {
    BUILD_TIME: new Date().toISOString(),
  },
  experimental: {
    agentFeedback: true,
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
