'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

// Root error boundary — reports React rendering crashes to Sentry (item 8b) and
// shows a minimal recovery screen. Only renders for errors in the root layout;
// route-level errors use app/error.tsx.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ background: '#0A1628', color: '#fff', fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 420 }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ color: '#9CA3AF', marginBottom: 24, lineHeight: 1.6 }}>
            An unexpected error occurred. Our team has been notified.
          </p>
          <button
            onClick={() => reset()}
            style={{ background: '#FF6B35', color: '#fff', fontWeight: 600, padding: '12px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', minHeight: 44 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
