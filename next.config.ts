import type { NextConfig } from "next";

// The app is a client-only prototype (state lives in Zustand + localStorage),
// so Cache Components / partial prefetching are intentionally left disabled.
const nextConfig: NextConfig = {
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
