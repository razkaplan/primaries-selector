import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // the election overview moved from /knesset to the home page
    return [{ source: "/knesset", destination: "/", permanent: true }];
  },
};

export default nextConfig;
