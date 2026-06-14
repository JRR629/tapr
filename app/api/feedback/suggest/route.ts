import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const schema = z.object({
  categorySlug: z.string().min(1),
  brand: z.string().optional(),
  modelName: z.string().min(2),
  productUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().max(500).optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized', code: 'UNAUTHENTICATED' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body', code: 'INVALID_JSON' }, { status: 400 })
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    return Response.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        fields: result.error.flatten().fieldErrors,
      },
      { status: 422 }
    )
  }

  const { categorySlug, brand, modelName, productUrl, notes } = result.data

  const { error } = await supabase.from('product_suggestions').insert({
    user_id: user.id,
    category_slug: categorySlug,
    brand: brand ?? null,
    model_name: modelName,
    product_url: productUrl || null,
    notes: notes ?? null,
    status: 'pending',
  })

  if (error) {
    console.error('[suggest] insert error:', error)
    return Response.json(
      { error: 'Failed to save suggestion', code: 'DB_ERROR' },
      { status: 500 }
    )
  }

  return Response.json({ message: 'Suggestion received. Thank you!' }, { status: 201 })
}
