import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true
  },
  experimental: {
    serverComponentsHmrCache: false, // defaults to true
  },
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
