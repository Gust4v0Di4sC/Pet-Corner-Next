import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/app-react/:path*",
        destination: "/app-react/index.html",
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/app-react/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
