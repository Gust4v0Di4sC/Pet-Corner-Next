// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      // Rewrite para servir o index.html da SPA para todas as rotas /app-react/*
      {
        source: '/app-react/:path*',
        destination: '/app-react/index.html',
      },
    ]
  },
  
  // Configuração para servir arquivos estáticos
  async headers() {
    return [
      {
        source: '/app-react/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
