'use client'

import * as Sentry from '@sentry/nextjs'
import { useState } from 'react'

// TEMPORARY — Sentry wiring verification. Delete after confirming the event
// lands in the Sentry dashboard.
export default function SentryCheck() {
  const [sent, setSent] = useState(false)
  return (
    <div style={{ minHeight: '100vh', background: '#0A1628', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'sans-serif' }}>
      <p style={{ color: '#9CA3AF' }}>Temporary Sentry verification page</p>
      <button
        onClick={() => {
          Sentry.captureException(new Error('Tapr Sentry test — ' + new Date().toISOString()))
          setSent(true)
        }}
        style={{ background: '#FF6B35', color: '#fff', fontWeight: 600, padding: '12px 24px', borderRadius: 8, border: 'none', cursor: 'pointer' }}
      >
        Send test event to Sentry
      </button>
      {sent && <p style={{ color: '#22C55E' }}>✓ Sent. Check your Sentry dashboard in ~1 minute (Issues tab).</p>}
      <p style={{ color: '#6B7280', fontSize: 12, maxWidth: 360, textAlign: 'center' }}>
        If nothing appears: the DSN isn&apos;t set for this environment, or the build predates it.
      </p>
    </div>
  )
}
