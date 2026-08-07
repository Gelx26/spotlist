import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Listing photos are pasted in as external URLs for now, so allow any
    // https host rather than maintaining an allowlist.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
}

export default nextConfig
