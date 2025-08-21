import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Configuración para PWA y Service Worker
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
  
  // Configuración para optimización de assets
  experimental: {
    optimizeCss: true,
  },
  
  // Configuración para PWA
  async rewrites() {
    return [
      {
        source: '/offline',
        destination: '/offline',
      },
    ];
  },

  // Configuración para evitar warnings de lockfiles
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
