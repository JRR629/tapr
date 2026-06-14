export type Layer2Responses = Record<string, string | string[] | number | boolean>

export interface RecommendationTopPick {
  productId: string
  productName: string
  priceUsd: number
  alreadyOwned?: boolean
  personalizedReason: string
  keyStrengths: string[]
  keyWeaknesses: string[]
  oneHonestCaveat: string
  /** Server-injected after Claude responds — never produced by the AI */
  imageUrl?: string | null
}

export interface RecommendationRunnerUp {
  productId: string
  productName: string
  priceUsd: number
  alreadyOwned?: boolean
  whyConsider: string
  whyNotTop: string
  /** Server-injected after Claude responds — never produced by the AI */
  imageUrl?: string | null
}

export interface RecommendationUpgradeOption {
  productId: string
  productName: string
  priceUsd: number
  whyUpgrade: string
  keyImprovement: string
  /** Server-injected after Claude responds — never produced by the AI */
  imageUrl?: string | null
}

export interface RecommendationResult {
  topPick: RecommendationTopPick
  runnerUp: RecommendationRunnerUp
  upgradeOption?: RecommendationUpgradeOption
  profileSpecificWarnings: string[]
  sourcesDrawnFrom: Array<{ name: string; url?: string } | string>
  confidenceLevel: 'high' | 'medium' | 'low'
  lowConfidenceReason?: string
  appleEcosystemNote?: string | null
}

// ─── Nutrition recommendation types ───────────────────────────────────────────

export interface NutritionOption {
  productId: string | null
  productName: string
  priceUsd: number | null
  whyItWorks: string
  differentiator: string
}

export interface NutritionSupplement {
  productId: string | null
  productName: string | null
  priceUsd: number | null
  whenToUse: string
}

interface NutritionResultBase {
  sport: 'triathlon' | 'cycling' | 'running'
  raceDuration: string
  fuelingStrategy: string
  profileSpecificWarnings: string[]
  sourcesDrawnFrom: Array<{ name: string; url?: string } | string>
  confidenceLevel: 'high' | 'medium' | 'low'
  lowConfidenceReason?: string | null
  longRaceSupplement?: NutritionSupplement | null
}

export interface NutritionResultTriSplit extends NutritionResultBase {
  sport: 'triathlon'
  strategy: 'split'
  bikeOptions: NutritionOption[]
  runOptions: NutritionOption[]
}

export interface NutritionResultTriUnified extends NutritionResultBase {
  sport: 'triathlon'
  strategy: 'unified'
  viableOptions: NutritionOption[]
}

export interface NutritionResultSingle extends NutritionResultBase {
  sport: 'cycling' | 'running'
  strategy: 'single'
  viableOptions: NutritionOption[]
}

export type NutritionResult = NutritionResultTriSplit | NutritionResultTriUnified | NutritionResultSingle

// ─── Running shoe recommendation types ───────────────────────────────────────

export type PurposeFitLabel = 'excellent' | 'good' | 'acceptable' | 'avoid' | 'unknown'

export interface PurposeFitMatrix {
  daily_training: PurposeFitLabel
  tempo: PurposeFitLabel
  long_runs: PurposeFitLabel
  racing: PurposeFitLabel
  recovery: PurposeFitLabel
}

/** Primary pick and each alternative slot share this base shape */
export interface ShoePrimaryPick {
  productId: string
  productName: string
  priceUsd: number
  personalizedReason: string       // 3-4 sentences referencing specific profile attributes
  purposeFitMatrix: PurposeFitMatrix
  versatilityVerdict: string       // e.g. "covers daily + long runs well; race-day acceptable if you don't race often"
  keyStrengths: string[]
  tradeoffs: string[]              // e.g. "carbon plate adds speed but ~250mi durability"
  oneHonestCaveat: string
  raceLegalityNote?: string        // only when relevant
  isPreviousGen: boolean
  amazonLinkConfidence: 'exact_current' | 'exact_prior' | 'ambiguous' | 'avoid' | 'unknown'
  /** Server-injected after Claude responds — never produced by the AI */
  imageUrl?: string | null
}

export interface ShoeAlternativeItem {
  productId: string
  productName: string
  priceUsd: number
  whyConsider: string              // when to choose this over the primary pick
  differentiator: string           // short phrase — what makes this slot distinct
  isPreviousGen: boolean
  amazonLinkConfidence: 'exact_current' | 'exact_prior' | 'ambiguous' | 'avoid' | 'unknown'
  /** Server-injected after Claude responds — never produced by the AI */
  imageUrl?: string | null
}

export interface ShoeRotationPairing {
  productId: string
  productName: string
  whenToUse: string
  /** Server-injected after Claude responds — never produced by the AI */
  imageUrl?: string | null
}

export interface ShoeRotationSuggestion {
  rationale: string                        // e.g. "you race monthly AND log 40+mi/wk — a dedicated race shoe is justified"
  estimatedAnnualCostDelta: number         // rough extra annual cost of rotation vs single shoe
  pairing: {
    everyday: ShoeRotationPairing
    raceDay: ShoeRotationPairing
  }
}

export interface RunningShoeResult {
  primaryPick: ShoePrimaryPick
  alternatives: {
    safer: ShoeAlternativeItem
    faster: ShoeAlternativeItem | null
    value: ShoeAlternativeItem
  }
  rotationSuggestion?: ShoeRotationSuggestion | null
  profileSpecificWarnings: string[]
  sourcesDrawnFrom: Array<{ name: string; url?: string | null }>
  confidenceLevel: 'high' | 'medium' | 'low'
  lowConfidenceReason?: string | null
}
