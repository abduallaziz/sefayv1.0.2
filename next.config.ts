import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${API_ORIGIN}/:path*`,
      },
    ]
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-switch',
      '@radix-ui/react-tooltip',
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

export default withNextIntl(nextConfig)