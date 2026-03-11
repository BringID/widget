import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true
  },
  experimental: {
    serverComponentsHmrCache: false, // defaults to true
  },
  outputFileTracingIncludes: {
    '/content/api/zkpassport/sign-score': [
      './node_modules/@aztec/bb.js/dest/node/barretenberg_wasm/**/*.wasm.gz',
    ],
  },
  serverExternalPackages: ['@neynar/nodejs-sdk', '@zkpassport/sdk', 'pino', 'thread-stream'],
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    // Important: return the modified config
    config.externals.push('pino-pretty', 'lokijs', 'encoding')

    return config
  },
}

export default nextConfig
