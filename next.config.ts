import type { NextConfig } from 'next'
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

// Required for Cloudflare context (KV, D1, R2, etc.) to be available during local dev.
// https://opennext.js.org/cloudflare/get-started
initOpenNextCloudflareForDev()

const nextConfig: NextConfig = {}

export default nextConfig
