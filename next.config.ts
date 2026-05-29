import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "conck6wgg6.ufs.sh",
        port: "",
        pathname: "/**", // 해당 도메인의 모든 경로 허용
      },
    ],
  },
};

export default nextConfig;
