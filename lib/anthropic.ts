import Anthropic from '@anthropic-ai/sdk'
import type { AthleteProfile } from '@/types/profile'
import type { GearProduct, GearProductWithReviews } from '@/types/gear'
import type { Layer2Responses } from '@/types/recommendation'

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

export interface PromptArgs {
  profile: AthleteProfile
  layer2Responses: Layer2Responses
  products: GearProductWithReviews[]
  budgetMin: number
  budgetMax: number
  categorySlug: string
}

export function buildRecommendationPrompt(args: PromptArgs): string {
  const { profile, layer2Responses, products, budgetMin, budgetMax, categorySlug } = args

  const age = profile.date_of_birth
    ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 'unknown'

  // Detect Apple ecosystem signals from Layer 2 responses.
  // Triggers when athlete explicitly selected Apple Watch, stated Apple brand
  // preference, OR owns an iPhone (strong ecosystem proxy).
  const appleSignals =
    layer2Responses.watch_type === 'I wear an Apple Watch and want to know if it works for triathlon' ||
    layer2Responses.brand_preference === 'Apple — want Apple Watch' ||
    (Array.isArray(layer2Responses.current_devices) &&
      (layer2Responses.current_devices as string[]).includes('Apple iPhone'))

  const ownsGear =
    typeof layer2Responses.owns_wetsuit === 'string' &&
    layer2Responses.owns_wetsuit.startsWith('Yes') &&
    typeof layer2Responses.owned_wetsuits === 'string' &&
    layer2Responses.owned_wetsuits.trim().length > 0

  const ownedGearSection = ownsGear
    ? `The athlete already owns the following in this category: ${layer2Responses.owned_wetsuits}. Treat these as priority candidates.`
    : 'The athlete does not currently own gear in this category.'

  const locationLine = (profile.city ?? '').trim() || (profile.state ?? '').trim()
    ? `- Location: ${[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}`
    : '- Location: not specified'

  return `You are Tapr, an expert triathlon gear advisor. Your recommendations are personalized and grounded in real review data — not generic best-of lists.

ATHLETE PROFILE (Layer 1):
- Race distance(s): ${profile.race_distances?.join(', ') ?? 'not specified'}
- Experience: ${profile.experience_level ?? 'not specified'}
- Background sport: ${profile.background_sport?.join(', ') ?? 'not specified'}
- Age: ${age} years old
- Gender: ${profile.gender ?? 'not specified'}
${locationLine}
- Height: ${profile.height_feet ?? ''}' ${profile.height_inches ?? ''}"
- Weight: ${profile.weight_lbs ?? ''} lbs
- Budget style: ${profile.budget_style ?? 'not specified'}
- Known fit issues: ${profile.fit_issues?.join(', ') ?? 'none reported'}
- Existing gear: ${profile.existing_gear?.join(', ') ?? 'none listed'}
- Racing pattern: ${profile.local_vs_travel ?? 'not specified'}, primarily ${profile.racing_season ?? 'not specified'}
- Target race: ${profile.target_race_name ?? 'none specified'} on ${profile.target_race_date ?? 'date not set'}

RACE CONTEXT:
Use your knowledge of ${profile.target_race_name ?? "the athlete's race"} to inform the recommendation. Consider typical water temperature, swim type, bike terrain, run surface, expected weather, and wetsuit legality. If location is not specified, do not infer or assume a specific city, venue, or region — work only from what is explicitly stated.

CATEGORY-SPECIFIC INPUTS (Layer 2):
${Object.entries(layer2Responses).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

OWNED GEAR IN THIS CATEGORY:
${ownedGearSection}

BUDGET RANGE: $${budgetMin} — ${budgetMax >= 999999 ? 'no upper limit' : `$${budgetMax}`}
${budgetMax >= 999999 ? 'The athlete has no upper budget constraint — recommend the best option for their profile regardless of price.' : 'This is a hard constraint. Only recommend products within this range.'}

BUDGET STYLE: "${profile.budget_style}"
Interpret this as how aggressively to justify premiums — NOT as a directive to minimize price.
- "Value-focused": cost-efficiency matters; every premium needs clear, specific justification
- "Mid-range / price-conscious": maximize value per dollar within the stated range. Do NOT default to the cheaper option. When two products both pass all hard disqualifiers and both fit within budget, prefer the better-suited product even at a $100–200 premium if the benefit is meaningful. Never recommend a product that barely clears a hard disqualifier threshold when a better option exists within budget.
- "Performance-first" or "No real limits": price within the stated range is not a factor — recommend the best match regardless of cost
${buildHardDisqualifiers(profile, layer2Responses as Record<string, unknown>, categorySlug)}
AVAILABLE PRODUCTS:
${JSON.stringify(products.slice(0, 20).map(stripProductForPrompt), null, 2)}

SWIMMER LEVEL:
Each product may include a swimmer_level array indicating who the suit is designed for: "beginner", "intermediate", "advanced", or combinations.
- Use swimmer_level as a personalization signal, not a hard filter — never exclude a product solely due to a mismatch.
- beginner: suit corrects poor body position with maximum buoyancy. Best for non-swimmers, first-timers, athletes with sinking legs.
- intermediate: balanced buoyancy and flexibility. Good all-around — the largest category.
- advanced: flexibility-focused, minimal buoyancy correction. Assumes the athlete already has strong technique and body position.
- If the athlete's profile suggests they are a beginner (new to triathlon, no swim background, first race) and a product is ["intermediate", "advanced"] only, flag this honestly in oneHonestCaveat — do not recommend it as topPick unless nothing better fits.
- If swimmer_level is null, ignore it and rely on buoyancy_profile and review content instead.
- A product with all three levels ["beginner", "intermediate", "advanced"] is genuinely versatile — do not penalize it.
- Weight swimmer_level alongside buoyancy_profile: maximum = beginner-friendly; flexibility_focused = advanced.

PRODUCT AVAILABILITY:
Each product includes an availability_status field. Apply these rules strictly:
- "current": recommend freely — this is an in-production model
- "previous_gen": still purchasable but superseded by a newer model, often at a reduced price. Only recommend if (a) it is a strong profile match AND budget is a constraint, OR (b) no current model fits as well. When recommended, note it is a previous-generation model still available on the market.
- "limited": hard to find — closeout or grey market only. Include only if it is clearly the best profile match AND nothing current comes close. Always flag: "Availability should be verified before purchase — this model may be difficult to find new."
- Never penalize a product solely for being previous_gen if it genuinely fits the athlete better than current alternatives.

APPLE ECOSYSTEM:
${appleSignals
  ? `This athlete has indicated Apple ecosystem affiliation (iPhone owner, Apple Watch user, or explicit Apple brand preference). You MUST populate the "appleEcosystemNote" field in your JSON response. Write 2-3 candid sentences covering: (1) whether Apple Watch Ultra 3 was considered, (2) why it was or was not the top recommendation for this specific athlete's goals, and (3) what they would gain or give up relative to the top pick. Be honest and specific — do not be dismissive of Apple Watch, but do not oversell it either. Apple fans want to know the watch was genuinely evaluated, not ignored. Populate this field even if Apple Watch Ultra 3 IS the top recommendation.`
  : 'No Apple ecosystem signals detected. Set appleEcosystemNote to null.'}

DATA QUALITY TIERS:
Each product in AVAILABLE PRODUCTS includes a data_quality field. Apply these rules strictly:
- "reviewed": Has ≥1 independent Tier 1 review from a major outlet. Cite sources freely. Full confidence eligible.
- "community_reviewed": Has coverage from blogs, forums, or athlete testing — not major outlets. Use review data available but note limited coverage in lowConfidenceReason. Confidence cap: "medium".
- "specs_verified": Has manufacturer specs curated and verified by Tapr — no independent reviews exist yet. Recommend when specs strongly match the athlete's profile. Always include in oneHonestCaveat: "This suit hasn't been independently reviewed yet — this recommendation is based on verified manufacturer specs." Confidence cap: "medium".
- "retailer_reviewed": Retailer or sponsored content only. Treat identically to specs_verified.
- "stub": Exclude from recommendations entirely. Do not mention these products.

When the top pick is "specs_verified" or "community_reviewed", set confidenceLevel to "medium" or "low" — never "high". When the top pick is "reviewed", high confidence is appropriate if the profile match is strong.

INSTRUCTIONS:
- Recommend ONLY from the products listed above
- Reference specific profile attributes in every reasoning statement
- Cite the review sources that informed each recommendation
- Be honest about limitations relevant to this athlete's specific situation
- Respect the budget range as a hard constraint

OWNED GEAR RULES — FOLLOW THESE IN ORDER BEFORE SELECTING topPick:

STEP 1 — CHECK FOR OWNED GEAR: Read the OWNED GEAR IN THIS CATEGORY section. If the athlete owns one or more products, proceed to STEP 2. If not, skip to STEP 5.

STEP 2 — IDENTIFY OWNED PRODUCTS: For each owned product name, search AVAILABLE PRODUCTS for a match by name. If found, note its productId. If not found in the list, you may still reference it from your training knowledge — set productId to null for those.

STEP 3 — COMPARISON MODE (owns 2+): If the athlete owns two or more products and is asking which to use:
- topPick MUST be the better of their owned options. Set alreadyOwned: true. Set productId from STEP 2 (null if not in DB).
- runnerUp MUST be their other owned product. Set alreadyOwned: true.
- NEVER set topPick to a product the athlete does not own, regardless of quality. Use upgradeOption for that.

STEP 4 — UPGRADE CHECK: After assigning topPick and runnerUp from owned gear, ask: does any non-owned product in AVAILABLE PRODUCTS offer a substantial, measurable improvement for this specific athlete? Substantial means: saves 60+ sec/100m in testing, prevents a meaningful fit or safety issue, or addresses a critical weakness the owned gear structurally cannot. If yes AND within budget, populate upgradeOption. If not, omit upgradeOption entirely.

STEP 5 — SINGLE OWNED PRODUCT: If the athlete owns only one product, it becomes topPick (alreadyOwned: true). runnerUp may be a non-owned alternative.

STEP 6 — NO OWNED GEAR: Select topPick and runnerUp freely from AVAILABLE PRODUCTS. Set alreadyOwned: false on both.

GENDER AND VARIANT CAVEAT RULE:
When flagging fit concerns related to gender-specific cuts, first verify whether the brand offers gender-specific variants of that product. If gender-specific versions exist, frame the caveat conditionally: "if you have the men's/unisex version..." rather than stating a fit concern as fact. Do not assume which variant the athlete owns.

LOCATION RULE:
Do not infer, assume, or name specific cities, venues, or regions beyond what the athlete has explicitly stated. If location is not provided, omit it from your reasoning entirely.

Return ONLY valid JSON:
{
  "topPick": {
    "productId": "uuid",
    "productName": "string",
    "priceUsd": 0,
    "alreadyOwned": false,
    "personalizedReason": "3-4 sentences referencing specific profile attributes",
    "keyStrengths": ["athlete-specific strength", "athlete-specific strength", "athlete-specific strength"],
    "keyWeaknesses": ["genuine limitation for this athlete", "genuine limitation for this athlete"],
    "oneHonestCaveat": "one sentence — the single most important tradeoff for this specific athlete"
  },
  "runnerUp": {
    "productId": "uuid",
    "productName": "string",
    "priceUsd": 0,
    "alreadyOwned": false,
    "whyConsider": "2 sentences — when to choose this over the top pick",
    "whyNotTop": "1 sentence"
  },
  "upgradeOption": {
    "productId": "uuid",
    "productName": "string",
    "priceUsd": 0,
    "whyUpgrade": "2-3 sentences explaining what this does substantially better than the owned top pick for this specific athlete",
    "keyImprovement": "one phrase — the single biggest improvement over what they own"
  },
  "profileSpecificWarnings": ["string"],
  "sourcesDrawnFrom": ["source name 1"],
  "confidenceLevel": "high|medium|low",
  "lowConfidenceReason": "only if confidence is medium or low",
  "appleEcosystemNote": "2-3 sentences when Apple signals present — was Apple Watch Ultra 3 considered, why recommended or not, what is gained or lost vs top pick | null when no Apple signals"
}`
}

/**
 * Strip fields Claude cannot use, keeping all substantive review content.
 * data_quality and specs_verified_at are intentionally kept — Claude uses data_quality
 * to apply confidence rules (see DATA QUALITY TIERS in the prompt).
 * sponsored is kept on review sources so Claude can weight sponsored content appropriately.
 */
function stripProductForPrompt(product: GearProductWithReviews): object {
  const { image_path, is_active, created_at, gear_categories, affiliate_url, ...productRest } = product as GearProductWithReviews & { affiliate_url?: string | null }
  void image_path; void is_active; void created_at; void gear_categories; void affiliate_url
  // data_quality, specs_verified_at remain in productRest — do not strip

  const cleanedSources = (productRest.review_sources ?? []).map((source) => {
    const { id, product_id, source_type, review_date, created_at: src_created_at, ...sourceRest } = source
    void id; void product_id; void source_type; void review_date; void src_created_at
    return sourceRest // source_url and sponsored are kept intentionally
  })

  return { ...productRest, review_sources: cleanedSources }
}

/**
 * Derives hard disqualifier rules from Layer 2 answers + athlete profile.
 * Returns a prompt section injected before any scoring instructions.
 * Rules here are NON-NEGOTIABLE — they convert stated requirements into
 * explicit exclusions Claude must apply before evaluating any product.
 */
function buildHardDisqualifiers(
  profile: AthleteProfile,
  layer2Responses: Record<string, unknown>,
  categorySlug: string
): string {
  const rules: string[] = []

  const isTriathlete = (profile.race_distances ?? []).some((d) =>
    ['Sprint', 'Olympic', '70.3 Half Ironman', 'Full Ironman'].some((t) =>
      (d as string).toLowerCase().includes(t.toLowerCase())
    )
  )

  if (categorySlug === 'gps-watches') {
    // Triathlon mode — only a hard requirement when athlete is actually racing triathlon
    const needsTri =
      typeof layer2Responses.triathlon_mode === 'string' &&
      layer2Responses.triathlon_mode.startsWith('Yes')
    if (needsTri && isTriathlete) {
      rules.push(
        'TRIATHLON MODE REQUIRED: This athlete explicitly stated they need triathlon mode (swim → bike → run multi-sport sequencing). Any watch that does not support dedicated triathlon/multi-sport mode is INELIGIBLE to be topPick or comparison winner. Check specs and review content — if support is ambiguous, treat the product as ineligible.'
      )
    }

    // Battery — Ironman
    const longestEvent =
      typeof layer2Responses.longest_event === 'string' ? layer2Responses.longest_event : ''
    if (longestEvent.includes('Full Ironman') || longestEvent.includes('10–17')) {
      rules.push(
        'BATTERY MINIMUM (IRONMAN): This athlete races Full Ironman distances (10–17 hours). Any watch with GPS battery life under 20 hours is INELIGIBLE as topPick or comparison winner.'
      )
    } else if (longestEvent.includes('70.3') || longestEvent.includes('4–8')) {
      rules.push(
        'BATTERY MINIMUM (70.3): This athlete races 70.3 distances (4–8 hours). Any watch with GPS battery life under 10 hours is INELIGIBLE as topPick or comparison winner.'
      )
    }

    // Dedicated sports watch
    const watchType =
      typeof layer2Responses.watch_type === 'string' ? layer2Responses.watch_type : ''
    if (watchType.toLowerCase().includes('dedicated sports') || watchType.toLowerCase().includes('triathlon watch')) {
      rules.push(
        'WATCH TYPE: This athlete requires a dedicated sports/triathlon watch. Consumer lifestyle watches (Apple Watch non-Ultra, fashion-oriented wearables, basic fitness trackers) are INELIGIBLE.'
      )
    }
  }

  if (categorySlug === 'wetsuits') {
    // Cold water thermal protection
    const waterTemp =
      typeof layer2Responses.water_temp === 'string' ? layer2Responses.water_temp : ''
    if (waterTemp.includes('Below 60°F') || waterTemp.includes('very cold')) {
      rules.push(
        'THERMAL PROTECTION REQUIRED: This athlete is racing in water below 60°F where hypothermia is a real risk. Wetsuits with thin neoprene (<4mm core panels), suits marketed primarily for flexibility in warm water, or suits without substantial thermal insulation are INELIGIBLE as topPick or comparison winner.'
      )
    }

    // Full sleeve required
    const sleevePreference =
      typeof layer2Responses.sleeve_preference === 'string' ? layer2Responses.sleeve_preference : ''
    if (sleevePreference.startsWith('Full sleeve')) {
      rules.push(
        'FULL SLEEVE REQUIRED: This athlete explicitly requires a full-sleeve wetsuit. Sleeveless wetsuits are INELIGIBLE as topPick or comparison winner.'
      )
    }

    // Wetsuit prohibited by race
    const wetsuitPermitted =
      typeof layer2Responses.wetsuit_permitted === 'string' ? layer2Responses.wetsuit_permitted : ''
    if (wetsuitPermitted.toLowerCase().includes('no') && wetsuitPermitted.toLowerCase().includes('prohibit')) {
      rules.push(
        'WETSUIT PROHIBITED: This athlete\'s race does not permit wetsuits. Do not recommend any wetsuit. Explain this in your response instead of providing a normal recommendation.'
      )
    }
  }

  // Brand preference: ecosystem ownership is a strong signal — not a tiebreaker
  const brandPref = typeof layer2Responses.brand_preference === 'string' ? layer2Responses.brand_preference : ''
  const isEcosystemClaim =
    brandPref.toLowerCase().includes('ecosystem') ||
    brandPref.toLowerCase().includes('already in') ||
    brandPref.toLowerCase().includes('already use')
  const ECOSYSTEM_BRANDS: Record<string, string> = {
    garmin: 'Garmin', suunto: 'Suunto', polar: 'Polar', coros: 'COROS',
    apple: 'Apple', blueseventy: 'Blueseventy', orca: 'Orca', zone3: 'Zone3',
  }
  const matchedBrand = Object.entries(ECOSYSTEM_BRANDS).find(([key]) => brandPref.toLowerCase().includes(key))

  if (isEcosystemClaim && matchedBrand) {
    const [, brandName] = matchedBrand
    rules.push(
      `BRAND PREFERENCE (ECOSYSTEM): This athlete stated a preference for ${brandName} and cited existing ecosystem ownership as the reason. ${brandName} products are strongly preferred. Only recommend a non-${brandName} product if: (1) no ${brandName} product in the pool passes all hard disqualifiers above, OR (2) the best ${brandName} option has a specific, named critical weakness for this athlete's primary stated requirements. A competitor having marginally better recovery metrics, slightly more battery life, or a better overall review score does NOT override a stated ecosystem preference — those advantages must be substantial and directly relevant to a stated requirement. When recommending ${brandName}, you may note where competitors excel, but ${brandName} wins the tie.`
    )
  }

  if (rules.length === 0) return ''

  return `
HARD DISQUALIFIERS — APPLY BEFORE ANY SCORING:
The following rules are derived from this athlete's stated non-negotiable requirements. Products that violate any rule below are INELIGIBLE to be topPick or comparison winner, regardless of scores, price, or general quality. Apply these first, then rank among remaining eligible products.

${rules.map((r, i) => `${i + 1}. ${r}`).join('\n\n')}
`
}

// Tells Claude which dimensions are relevant evidence per category.
// Add new entries as categories launch — no other code changes needed.
const CATEGORY_SCORE_DIMENSIONS: Record<string, string[]> = {
  'gps-watches': ['gps_accuracy', 'battery_life', 'hr_accuracy', 'ease_of_use', 'display_quality', 'triathlon_features', 'value'],
  'wetsuits': ['flexibility', 'buoyancy', 'comfort', 'durability', 'value'],
  'goggles': ['fit', 'clarity', 'anti_fog', 'durability', 'value'],
  'tri-suits': ['comfort', 'aerodynamics', 'fit', 'durability', 'value'],
  'running-shoes': ['cushioning', 'stability', 'durability', 'fit', 'value'],
  'bikes': ['stiffness', 'weight', 'aerodynamics', 'comfort', 'value'],
}

export interface ComparisonPromptArgs {
  profile: AthleteProfile
  layer2Responses: Record<string, unknown> | null // null when no rec context available
  dbProducts: GearProductWithReviews[] // 0-3 products from Tapr database (with reviews)
  externalProducts: string[] // 0-2 free-text product names (not in DB)
  categorySlug: string
  originalTopPickId?: string // from recommendation context, if available
  budgetMin?: number // from category_responses, if available
  budgetMax?: number // from category_responses, if available
}

export function buildComparisonPrompt(args: ComparisonPromptArgs): string {
  const { profile, layer2Responses, dbProducts, externalProducts, categorySlug, originalTopPickId, budgetMin, budgetMax } = args

  const age = profile.date_of_birth
    ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 'unknown'

  const appleSignals =
    layer2Responses?.watch_type === 'I wear an Apple Watch and want to know if it works for triathlon' ||
    layer2Responses?.brand_preference === 'Apple — want Apple Watch' ||
    (Array.isArray(layer2Responses?.current_devices) &&
      (layer2Responses.current_devices as string[]).includes('Apple iPhone'))

  const locationLine = (profile.city ?? '').trim() || (profile.state ?? '').trim()
    ? `- Location: ${[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}`
    : '- Location: not specified'

  const scoreDimensions = CATEGORY_SCORE_DIMENSIONS[categorySlug] ?? ['performance', 'comfort', 'durability', 'value']

  const layer2Section = layer2Responses && Object.keys(layer2Responses).length > 0
    ? `\nCATEGORY-SPECIFIC INPUTS (Layer 2):\n${Object.entries(layer2Responses).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n`
    : ''

  const hardDisqualifiers = layer2Responses && Object.keys(layer2Responses).length > 0
    ? buildHardDisqualifiers(profile, layer2Responses, categorySlug)
    : ''

  const originalTopPickSection = originalTopPickId
    ? `\nPRIOR RECOMMENDATION CONTEXT: Product ${originalTopPickId} was selected as the best match for this athlete from the full product catalog, with complete profile and budget context across all available options. The athlete is now doing a head-to-head comparison — a narrower view. Do NOT reverse this verdict unless you can identify a specific, named, data-backed dealbreaker that is directly relevant to this athlete's stated use case. A score advantage or price difference alone is not sufficient to overturn a prior recommendation. If no clear dealbreaker exists, validate the prior recommendation.\n`
    : ''

  const budgetSection = budgetMin !== undefined && budgetMax !== undefined
    ? `\nBUDGET CONTEXT: This athlete set a budget of $${budgetMin}–${budgetMax >= 999999 ? 'no upper limit' : `$${budgetMax}`} when they ran their recommendation. Apply this as a soft constraint — note if any product meaningfully exceeds it, but do not disqualify products from comparison analysis based on budget alone.\n`
    : ''

  const externalSection = externalProducts.length > 0
    ? `\nPRODUCTS FROM USER INPUT (analyze from your training knowledge):\n${externalProducts.map((p) => `- ${p}`).join('\n')}\n\nFor these products: use your training knowledge to assess fit for this athlete's profile. Set isExternal: true and write a brief externalDataCaveat (e.g. "Analysis based on Claude's training knowledge. Verify current specs and availability before purchase."). Assign priceUsd your best estimate or null if uncertain. These products are fully eligible to win — do not penalize them for not being in our database.\n`
    : ''

  return `You are Tapr, an expert triathlon gear advisor. Your comparisons are personalized and grounded in review data — not generic rankings.

ATHLETE PROFILE (Layer 1):
- Race distance(s): ${profile.race_distances?.join(', ') ?? 'not specified'}
- Experience: ${profile.experience_level ?? 'not specified'}
- Background sport: ${(profile.background_sport as string[] | null)?.join(', ') ?? 'not specified'}
- Age: ${age} years old
- Gender: ${profile.gender ?? 'not specified'}
${locationLine}
- Height: ${profile.height_feet ?? ''}' ${profile.height_inches ?? ''}"
- Weight: ${profile.weight_lbs ?? ''} lbs
- Budget style: ${profile.budget_style ?? 'not specified'}
- Known fit issues: ${profile.fit_issues?.join(', ') ?? 'none reported'}
- Existing gear: ${profile.existing_gear?.join(', ') ?? 'none listed'}
- Racing pattern: ${profile.local_vs_travel ?? 'not specified'}, primarily ${profile.racing_season ?? 'not specified'}
- Target race: ${profile.target_race_name ?? 'none specified'} on ${profile.target_race_date ?? 'date not set'}
${layer2Section}${hardDisqualifiers}${budgetSection}${originalTopPickSection}
PRODUCTS FROM TAPR DATABASE (with full review data):
${JSON.stringify(dbProducts.map(stripProductForPrompt), null, 2)}
${externalSection}
RELEVANT SCORING DIMENSIONS FOR THIS CATEGORY (${categorySlug}):
${scoreDimensions.join(', ')}
Use these as your evidence framework when citing review scores or comparing specifications.

TASK: Perform a head-to-head comparison of all products above, speaking directly to the athlete.
Rules:
- VOICE: Always write in second person — use "you" and "your" to address the athlete directly. Never write "the athlete", "this athlete", or any third-person reference. Every sentence should feel like the app is talking directly to the person reading it. Examples: "Your Ironman distance focus means..." NOT "For athletes racing Ironman...". "Given your mid-budget style..." NOT "The athlete's budget..."
- Reference specific profile attributes in every breakdown (not generic claims) — but do so in second person
- For DB products: use review data (sentiment, key_points, full_summary, category_scores) as evidence
- For external products: cite your knowledge of the product's specifications and reputation
- profileFitScore (1-10) reflects YOUR profile, not general product quality
- tradeoffs: 3-5 dimensions where products genuinely differ; mattersForThisAthlete must reflect whether this specific use case is affected
- cheaperOptionVerdict: if price spread >= $50 AND the cheaper option satisfies all HARD DISQUALIFIERS above, give a 2-3 sentence honest verdict on whether it is defensible for this athlete; if the cheaper option fails any hard disqualifier, set this to null — never use price advantage to promote an ineligible product
- verdict: name a specific winner — do not hedge

LOCATION RULE:
Do not infer, assume, or name specific cities, venues, or regions beyond what the athlete has explicitly stated. If location is not provided, omit it from your reasoning entirely.

APPLE ECOSYSTEM:
${appleSignals
    ? `This athlete has indicated Apple ecosystem affiliation. You MUST populate the "appleEcosystemNote" field. Write 2-3 candid sentences covering: (1) whether Apple Watch Ultra 3 was considered, (2) why it was or was not the stronger match for this athlete's goals, and (3) what they would gain or give up. Populate this even if Apple Watch IS the top pick.`
    : 'No Apple ecosystem signals detected. Set appleEcosystemNote to null.'}

CONFIDENCE GUIDANCE:
- If all products are from the DB with strong review coverage: "high" is appropriate
- If any external products are included: default to "medium" unless the comparison is very clear-cut
- If both products are external: "medium" is the ceiling

Return ONLY valid JSON:
{
  "products": [
    {
      "productId": "uuid or null",
      "productName": "string",
      "priceUsd": 0,
      "isExternal": false,
      "externalDataCaveat": "string or omit if isExternal is false",
      "profileFitScore": 8,
      "profileFitRationale": "2-3 sentences in second person, e.g. 'Your Ironman focus and mid-budget style mean...'",
      "strongSuitsForThisAthlete": ["athlete-specific", "athlete-specific", "athlete-specific"],
      "weakSuitsForThisAthlete": ["athlete-specific", "athlete-specific"],
      "bestSituationFor": "one sentence",
      "worstSituationFor": "one sentence"
    }
  ],
  "tradeoffs": [
    {
      "dimension": "string",
      "winner": "product name",
      "whatYouGain": "one sentence",
      "whatYouLose": "one sentence",
      "mattersForThisAthlete": true,
      "athleteRelevanceNote": "one sentence"
    }
  ],
  "verdict": {
    "winnerProductId": "uuid or null if external winner",
    "winnerProductName": "string",
    "verdictSummary": "2-3 sentences in second person directly addressing you, e.g. 'Given your goals...'",
    "confidenceLevel": "high|medium|low",
    "runnerUpNote": "1 sentence in second person — when you should choose the alternative instead",
    "dealbreaker": "only if one product has a profile-specific dealbreaker"
  },
  "cheaperOptionVerdict": "string or null",
  "profileSpecificWarnings": ["string"],
  "sourcesDrawnFrom": [{"name": "source name", "url": "source_url from review_sources data, or omit if unavailable"}],
  "confidenceLevel": "high|medium|low",
  "lowConfidenceReason": "only if confidence is medium or low",
  "appleEcosystemNote": "string or null",
  "hasExternalProducts": false
}

For sourcesDrawnFrom: include the source_url field from the review_sources data for any DB product sources you cited. For external product sources or sources where no URL is available, omit the url field entirely.`
}

export const anthropic = new Proxy({} as Anthropic, {
  get(_, prop: string | symbol) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
