import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
    outputFileTracingIncludes: {
      '/api/generate-lesson': ['./node_modules/typescript/lib/lib.esnext.d.ts', './node_modules/typescript/lib/lib.dom.d.ts'],
    },
};

export default nextConfig;
