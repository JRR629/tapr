const requiredServerEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
] as const

const requiredPublicEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_APP_URL',
] as const

export function validateEnv(): void {
  const missing: string[] = []

  for (const key of requiredServerEnvVars) {
    if (!process.env[key]) missing.push(key)
  }
  for (const key of requiredPublicEnvVars) {
    if (!process.env[key]) missing.push(key)
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
