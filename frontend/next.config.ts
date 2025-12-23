import type { NextConfig } from "next";

// Determine backend URL based on environment
const isProd = process.env.NODE_ENV === "production";
const backendURL = isProd ? process.env.API_BASE_URL : "http://backend:8080";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    // API and upload requests on the frontend are forwarded to the backend server
    return [
      {
        source: "/api/:path*",
        destination: `${backendURL}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendURL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
