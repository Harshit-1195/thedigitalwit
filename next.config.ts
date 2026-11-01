import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Conservative security headers for every response.
  // Old addresses: the creative preview tool, and tools merged into others.
  async redirects() {
    return [
      { source: "/mockup-studio", destination: "/creative-studio", permanent: true },
      { source: "/media-planning", destination: "/media-plan-generator", permanent: true },
      { source: "/mixlens", destination: "/media-mix-model", permanent: true },
      { source: "/creative-specs", destination: "/creative-studio#specs", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // SAMEORIGIN: other sites can't frame us, but Creative Studio can run in a frame on our own pages.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
