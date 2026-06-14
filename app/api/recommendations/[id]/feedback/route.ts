import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {}
          },
        },
      }
    )

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json(
        { error: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      )
    }

    // 2. Parse and validate input
    const body = await request.json()
    const validation = feedbackSchema.safeParse(body)

    if (!validation.success) {
      return Response.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          fields: validation.error.flatten().fieldErrors,
        },
        { status: 422 }
      )
    }

    const { rating, comment } = validation.data
    const recId = params.id

    const adminDb = createAdminClient()

    // 3. Verify recommendation belongs to authenticated user
    const { data: rec, error: recError } = await adminDb
      .from('gear_recommendations')
      .select('user_id')
      .eq('id', recId)
      .single()

    if (recError || !rec) {
      console.error('[feedback] recommendation not found:', recError)
      return Response.json(
        { error: 'Recommendation not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    if (rec.user_id !== user.id) {
      return Response.json(
        { error: 'Access denied', code: 'UNAUTHORIZED' },
        { status: 403 }
      )
    }

    // 4. Update recommendation with feedback
    const { error: updateError } = await adminDb
      .from('gear_recommendations')
      .update({
        feedback_rating: rating,
        feedback_comment: comment || null,
        feedback_submitted_at: new Date().toISOString(),
      })
      .eq('id', recId)

    if (updateError) {
      console.error('[feedback] update error:', updateError)
      return Response.json(
        { error: 'Failed to save feedback', code: 'DB_ERROR' },
        { status: 500 }
      )
    }

    // 5. Success response
    return Response.json({ data: { success: true } })
  } catch (error) {
    console.error('[feedback]', error)
    return Response.json(
      { error: 'Something went wrong', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
