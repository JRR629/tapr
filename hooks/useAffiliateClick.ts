'use client'

export function useAffiliateClick() {
  async function trackClick(
    productId: string,
    recommendationId?: string,
    categorySlug?: string
  ): Promise<void> {
    try {
      const response = await fetch('/api/affiliate/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, recommendationId, categorySlug }),
      })

      if (response.ok) {
        const data = await response.json() as { redirectUrl?: string }
        if (data.redirectUrl) {
          window.open(data.redirectUrl, '_blank', 'noopener,noreferrer')
        }
      }
    } catch {
      // Silently swallow errors — tracking failures must never block the user
    }
  }

  return { trackClick }
}
