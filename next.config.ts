import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Card PNGs are rendered on the server from bundled font files.
  outputFileTracingIncludes: {
    '/api/card/[id]': ['./assets/fonts/**'],
  },
};

export default nextConfig;
