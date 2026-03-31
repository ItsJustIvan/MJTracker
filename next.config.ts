import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // This allows you to view the app on your phone or other devices 
    // using your local IP (192.168.68.61)
    allowedDevOrigins: ['192.168.68.61', 'localhost:3000'],
  },
};

export default nextConfig;