'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-sm opacity-70">
            The error has been reported. Try reloading the page.
          </p>
        </div>
      </body>
    </html>
  )
}
