import * as Sentry from '@sentry/nextjs'

export async function register() {
  const runtime = process.env.NEXT_RUNTIME
  if (runtime === 'nodejs' || runtime === 'edge') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
      enableLogs: true,
      sendDefaultPii: false,
    })
  }
}

// Reports errors thrown in Server Components, Server Actions and Route Handlers.
export const onRequestError = Sentry.captureRequestError
