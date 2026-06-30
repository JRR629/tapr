import * as Sentry from '@sentry/nextjs'

// Runs at server boot. Validates env (item 18) and initializes Sentry server/edge
// monitoring (item 8b) by importing the runtime-appropriate config.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('./lib/env')
    validateEnv()
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Captures errors thrown in App Router server components / route handlers.
export const onRequestError = Sentry.captureRequestError
