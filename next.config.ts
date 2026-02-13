import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_DATABASE_ENABLED: process.env.DATABASE_URL ? 'true' : '',
  },
}

export default nextConfig
