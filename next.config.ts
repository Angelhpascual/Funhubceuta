import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 604800, // 7 días
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'r2.thesportsdb.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.laliga.com',
      },
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
      },
    ],
  },
};

export default nextConfig;
