import type { NextConfig } from "next";

// The app is a client-only prototype (state lives in Zustand + localStorage),
// so Cache Components / partial prefetching are intentionally left disabled.
const nextConfig: NextConfig = {
  // Keep the dev badge away from the sidebar profile menu.
  devIndicators: { position: "bottom-right" },
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
