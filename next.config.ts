import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  serverExternalPackages: ['bcryptjs'],
  env: {
    NEXT_PUBLIC_DATABASE_ENABLED: process.env.DATABASE_URL ? 'true' : '',
  },
}

export default nextConfig
