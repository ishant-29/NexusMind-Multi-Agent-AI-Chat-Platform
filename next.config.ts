import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // pdf-parse (pdf.js) must run as a real Node module; bundling it breaks
  // its DOM polyfills (DOMMatrix, canvas)
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
