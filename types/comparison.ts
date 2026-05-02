// A product slot that exists in the Tapr database
export interface DBProductSlot {
  productId: string
  productName: string
  priceUsd: number
  isExternal: false
  isFromRecommendation: boolean
}

// A product slot typed in by the user — not in Tapr's database
export interface ExternalProductSlot {
  productName: string // free-text, e.g. "Garmin Forerunner 945 LTE"
  isExternal: true
  isFromRecommendation: false
}

export type CompareSlot = DBProductSlot | ExternalProductSlot

export interface ComparisonProductAnalysis {
  productId: string | null // null for external products
  productName: string
  priceUsd: number | null // null if Claude cannot determine price
  isExternal: boolean // true = analyzed from Claude's knowledge, not our DB
  externalDataCaveat?: string // present when isExternal: true
  profileFitScore: number // 1-10, consistent with category_scores scale
  profileFitRationale: string // 2-3 sentences
  strongSuitsForThisAthlete: string[] // 3 items
  weakSuitsForThisAthlete: string[] // 2 items
  bestSituationFor: string // one sentence
  worstSituationFor: string // one sentence
}

export interface ComparisonTradeoff {
  dimension: string // e.g. "Battery life vs. smartwatch integration"
  winner: string // product name (not ID)
  whatYouGain: string // one sentence
  whatYouLose: string // one sentence
  mattersForThisAthlete: boolean
  athleteRelevanceNote: string // one sentence explaining why it does/doesn't matter
}

export interface ComparisonVerdict {
  winnerProductId: string | null // null if winner is an external product
  winnerProductName: string
  verdictSummary: string // 2-3 sentences referencing athlete profile
  confidenceLevel: 'high' | 'medium' | 'low'
  runnerUpNote: string // 1 sentence — when to choose the alternative
  dealbreaker?: string // only if one product has a profile-specific dealbreaker
}

export interface ComparisonResult {
  products: ComparisonProductAnalysis[] // ordered by profileFitScore desc
  tradeoffs: ComparisonTradeoff[] // 3-5 key dimensions
  verdict: ComparisonVerdict
  cheaperOptionVerdict: string | null // null if price spread < $50 or prices unknown
  profileSpecificWarnings: string[]
  sourcesDrawnFrom: Array<{ name: string; url?: string } | string> // string kept for backward compat with old saved records
  confidenceLevel: 'high' | 'medium' | 'low'
  lowConfidenceReason?: string
  appleEcosystemNote?: string | null
  hasExternalProducts: boolean // true if any product was analyzed from Claude's knowledge
}
