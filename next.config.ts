import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
    outputFileTracingIncludes: {
      '/api/generate-lesson': ['node_modules/typescript/lib/lib.d.ts','node_modules/typescript/lib/lib.es5.d.ts', 'node_modules/typescript/lib/lib.es2015.d.ts'],
    },
};

export default nextConfig;
