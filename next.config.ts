import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
    outputFileTracingIncludes: {
      '/api/generate-lesson': ['./node_modules/typescript/lib/**'],
    },
};

export default nextConfig;
