import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const VALID_CORRECTION_TYPES = [
  'price',
  'specs',
  'availability',
  'recommendation_quality',
  'other',
] as const

const schema = z
  .object({
    productId: z.string().uuid().optional(),
    recommendationId: z.string().uuid().optional(),
    correctionType: z.enum(VALID_CORRECTION_TYPES),
    description: z.string().min(10).max(1000),
  })
  .refine((data) => data.productId !== undefined || data.recommendationId !== undefined, {
    message: 'At least one of productId or recommendationId must be provided',
    path: ['productId'],
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

  const { productId, recommendationId, correctionType, description } = result.data

  const { error } = await supabase.from('product_corrections').insert({
    user_id: user.id,
    product_id: productId ?? null,
    recommendation_id: recommendationId ?? null,
    correction_type: correctionType,
    description,
    status: 'pending',
  })

  if (error) {
    console.error('[correct] insert error:', error)
    return Response.json(
      { error: 'Failed to save correction', code: 'DB_ERROR' },
      { status: 500 }
    )
  }

  return Response.json(
    { message: 'Thank you for flagging this. Our team will review it.' },
    { status: 201 }
  )
}
