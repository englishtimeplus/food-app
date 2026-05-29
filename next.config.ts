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
        port: "",
        pathname: "/**", // 해당 도메인의 모든 경로 허용
      },
      {
        protocol: "https",
        hostname: "*.cafe24.com",
        port: "",
        pathname: "/**", // 해당 도메인의 모든 경로 허용
      },
      {
        protocol: "https",
        hostname: "*.namu.wiki",
        port: "",
        pathname: "/**", // 해당 도메인의 모든 경로 허용
      },
      {
        protocol: "https",
        hostname: "image.8dogam.com",
        port: "",
        pathname: "/**", // 해당 도메인의 모든 경로 허용
      },
    ],
  },
};

export default nextConfig;
