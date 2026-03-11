import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true
  },
  experimental: {
    serverComponentsHmrCache: false, // defaults to true
  },
  serverExternalPackages: ['@neynar/nodejs-sdk', '@zkpassport/sdk', 'pino', 'thread-stream'],
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    // Important: return the modified config
    config.externals.push('pino-pretty', 'lokijs', 'encoding')

    if (!isServer) {
      // Use CJS build of @zkpassport/sdk for client bundle to avoid ESM compatibility issues
      // (buffer/ directory import, JSON import attributes, CJS named imports)
      config.resolve.alias['@zkpassport/sdk'] = '@zkpassport/sdk/dist/cjs/index.cjs'
    }

    return config
  },
}

export default nextConfig
