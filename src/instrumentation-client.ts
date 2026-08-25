import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  enableLogs: true,
  // Attachments are signed URLs and messages are user content; keep both out of
  // error reports.
  sendDefaultPii: false,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
