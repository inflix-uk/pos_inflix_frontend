import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "randomuser.me", pathname: "/**" },
    ],
  },
  async redirects() {
    return [
      { source: "/wholesale-dashboard", destination: "/create-sales", permanent: true },
    ];
  },
};

export default nextConfig;
