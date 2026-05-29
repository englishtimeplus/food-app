import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.cafe24.com",
      },
      {
        protocol: "https",
        hostname: "*.namu.wiki",
      },
      {
        protocol: "https",
        hostname: "image.8dogam.com",
      },
    ],
  },
};

export default nextConfig;
