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
}

export interface RecommendationRunnerUp {
  productId: string
  productName: string
  priceUsd: number
  alreadyOwned?: boolean
  whyConsider: string
  whyNotTop: string
}

export interface RecommendationUpgradeOption {
  productId: string
  productName: string
  priceUsd: number
  whyUpgrade: string
  keyImprovement: string
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
