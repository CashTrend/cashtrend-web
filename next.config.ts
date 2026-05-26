import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /**
   * Proxy all /api/proxy/* requests to the Django backend (server-side).
   * This means the browser only ever sees same-origin requests — no CORS headers
   * needed on Django, ever.
   *
   * /api/proxy/api/users/login  →  http://127.0.0.1:8000/api/users/login
   * /api/proxy/api/tickers/...  →  http://127.0.0.1:8000/api/tickers/...
   */
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${process.env.BACKEND_URL ?? 'http://127.0.0.1:8000'}/:path*`,
      },
    ]
  },
}

export default nextConfig
