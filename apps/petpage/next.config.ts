import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/runtime-config.js",
        destination: "/app-react/runtime-config.js",
      },
      {
        source: "/app-react/:path*",
        destination: "/app-react/index.html",
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/app-react/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/app-react/runtime-config.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store",
          },
        ],
      },
      {
        source: "/runtime-config.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store",
          },
        ],
      },
      {
        source: "/app-react/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
