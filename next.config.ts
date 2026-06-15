import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  output: "standalone",
  eslint: {
    // Lint is enforced as a dedicated blocking step in CI (`npm run lint`, 0 errors),
    // so we skip Next's build-time lint pass to keep `next build` fast and avoid
    // double-linting. Type-safety is still enforced at build time via tsc.
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
