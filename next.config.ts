import type { NextConfig } from "next";

/**
 * Static export for GitHub Pages (the app is fully local-first / client-side).
 * `NEXT_PUBLIC_BASE_PATH` is set by the Pages workflow to `/<repository name>`, so
 * assets and links resolve under https://<owner>.github.io/<repo>/. It is derived
 * there rather than typed, so renaming the repository cannot silently break every
 * asset path. Left empty locally.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
