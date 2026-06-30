'use client'

import { useRouter } from 'next/navigation'
import CreditGate from '@/components/CreditGate'

// Client wrapper so the (server-rendered) category page can gate entry to the
// questionnaire on credit balance. When the athlete has credits, this proceeds
// to the questionnaire; when they have zero, CreditGate renders the inline
// buy-pack prompt instead of letting them answer 15 questions and dead-end on
// a 402 at the recommendation step.
export function StartRecommendationButton({
  categorySlug,
  label,
}: {
  categorySlug: string
  label: string
}) {
  const router = useRouter()
  return (
    <CreditGate
      cost={1}
      label={label}
      onProceed={() => router.push(`/gear/${categorySlug}/questionnaire`)}
    />
  )
}
