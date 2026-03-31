import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Most recent Next.js versions moved this here or handled it via env
  devIndicators: {
    appIsrStatus: true,
  },
  // If you are using a version where this is required for HMR:
  async headers() {
    return [
      {
        source: '/_next/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ]
  },
};

export default nextConfig;