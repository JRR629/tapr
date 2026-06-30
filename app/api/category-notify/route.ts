import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, clientIp } from '@/lib/ratelimit'

const notifySchema = z.object({
  email: z.string().email('Invalid email address'),
  categorySlug: z.string().min(1, 'Category slug is required'),
})

export async function POST(request: Request) {
  try {
    if (!(await checkRateLimit('category_notify', clientIp(request)))) {
      return Response.json({ error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' }, { status: 429 })
    }

    const body: unknown = await request.json()

    const parsed = notifySchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      )
    }

    const { email, categorySlug } = parsed.data

    const supabase = await createClient()

    // Check if already signed up
    const { data: existing } = await supabase
      .from('category_notify')
      .select('id')
      .eq('email', email)
      .eq('category_slug', categorySlug)
      .single()

    if (existing) {
      return Response.json(
        { error: 'Already signed up', code: 'ALREADY_SIGNED_UP' },
        { status: 200 }
      )
    }

    const { error } = await supabase
      .from('category_notify')
      .insert({ email, category_slug: categorySlug })

    if (error) {
      // Handle unique constraint violation gracefully
      if (error.code === '23505') {
        return Response.json(
          { error: 'Already signed up', code: 'ALREADY_SIGNED_UP' },
          { status: 200 }
        )
      }
      console.error('[category-notify POST]', error.message)
      return Response.json(
        { error: 'Failed to save notification request', code: 'DB_ERROR' },
        { status: 500 }
      )
    }

    return Response.json({ data: { success: true } }, { status: 200 })
  } catch (error) {
    console.error('[category-notify POST]', error)
    return Response.json(
      { error: 'Something went wrong', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
