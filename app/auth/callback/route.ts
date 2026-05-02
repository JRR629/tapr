import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // If a specific next param was provided, honour it
      if (searchParams.get('next')) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Otherwise check if this user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('athlete_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!profile) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Auth error — redirect to login with error flag
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
