import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const workerUrlEnvNames = [
  "NEXT_PUBLIC_CLOUDFLARE_WORKER_URL",
  "NEXT_PUBLIC_COSMOS_SYNC_URL",
  "NEXT_PUBLIC_CHAT_WORKER_URL",
] as const;

function readWorkerOrigins(): string[] {
  return workerUrlEnvNames
    .map((name) => process.env[name]?.trim())
    .filter((value): value is string => Boolean(value))
    .map((value) => {
      try {
        return new URL(value).origin;
      } catch {
        return "";
      }
    })
    .filter(Boolean);
}

function buildContentSecurityPolicy(): string {
  const connectSrc = [
    "'self'",
    "https://*.googleapis.com",
    "https://*.firebaseio.com",
    "https://*.firebaseapp.com",
    "https://identitytoolkit.googleapis.com",
    "https://securetoken.googleapis.com",
    "https://firestore.googleapis.com",
    "https://api.stripe.com",
    "https://*.stripe.com",
    "https://cdn.jsdelivr.net",
    "https://unpkg.com",
    ...readWorkerOrigins(),
  ];

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.gstatic.com https://www.google.com https://apis.google.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src ${Array.from(new Set(connectSrc)).join(" ")}`,
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.google.com https://www.recaptcha.net https://*.firebaseapp.com https://accounts.google.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self' blob:",
    isProduction ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function buildSecurityHeaders() {
  const headers = [
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy(),
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Cross-Origin-Opener-Policy",
      value: "same-origin-allow-popups",
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(self)",
    },
  ];

  if (isProduction) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains; preload",
    });
  }

  return headers;
}

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@phosphor-icons/react",
      "date-fns",
      "radix-ui",
      "@radix-ui/react-slot",
    ],
  },

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
    const securityHeaders = buildSecurityHeaders();

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
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
        source: "/:favicon(favicon.ico|favicon.svg|icon.svg|icon.png|icon0.svg|icon1.png|apple-icon.png|apple-touch-icon.png|manifest.json)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
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
