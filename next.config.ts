import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {}

export default withSentryConfig(nextConfig, {
  org: 'readint',
  project: 'pixelchat',
  silent: !process.env.CI,
  // Source maps are uploaded at build time then hidden from the client bundle,
  // so stack traces stay readable without shipping sources. Needs
  // SENTRY_AUTH_TOKEN in the build environment.
  widenClientFileUpload: true,
  webpack: { treeshake: { removeDebugLogging: true } },
})
