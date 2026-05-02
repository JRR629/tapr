import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from './OnboardingWizard'

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // If profile already exists, skip onboarding
  const { data: profile } = await supabase
    .from('athlete_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profile) redirect('/dashboard')

  return <OnboardingWizard />
}
