/**
 * TriKit AI — Stress Test Runner
 *
 * Runs synthetic athlete profiles through the full recommendation engine
 * (real Supabase products + real Anthropic API call) without requiring
 * user accounts or a running dev server.
 *
 * Usage (from trikit-ai directory):
 *   npx tsx scripts/stress-test.ts
 *   npx tsx scripts/stress-test.ts --category gps-watches
 *   npx tsx scripts/stress-test.ts --athlete alex
 *
 * Results written to: ../product-ops/stress-tests/results/
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ANTHROPIC_API_KEY) {
  console.error('Missing required env vars. Make sure .env.local is present in trikit-ai/')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

// ---------------------------------------------------------------------------
// Types (minimal inline — avoids @/ alias)
// ---------------------------------------------------------------------------

interface AthleteProfile {
  id: string
  user_id: string
  race_distances: string[]
  experience_level: string
  background_sport: string
  gender: string
  date_of_birth: string
  city: string
  state: string
  height_feet: number
  height_inches: number
  weight_lbs: number
  budget_style: string
  fit_issues: string[]
  existing_gear: string[]
  local_vs_travel: string
  racing_season: string
  target_race_name: string
  target_race_date: string
  inseam_inches?: number
  torso_length_inches?: number
  arm_span_inches?: number
  shoulder_width_inches?: number
  flexibility_level?: string
  current_bike?: string
  foot_width?: string
  arch_type?: string
  race_id?: null
  created_at?: string
  updated_at?: string
}

type Layer2Responses = Record<string, string | string[] | number | boolean>

interface TestCase {
  id: string           // slug for filenames
  athleteName: string
  category: 'gps-watches' | 'wetsuits'
  profile: AthleteProfile
  layer2: Layer2Responses
  budgetMin: number
  budgetMax: number
  notes: string        // what this test is designed to surface
}

interface ValidationResult {
  passed: boolean
  checks: { label: string; passed: boolean; detail?: string }[]
}

// ---------------------------------------------------------------------------
// Prompt builder (replicated from lib/anthropic.ts — keep in sync)
// ---------------------------------------------------------------------------

function buildTestPrompt(
  profile: AthleteProfile,
  layer2Responses: Layer2Responses,
  products: object[],
  budgetMin: number,
  budgetMax: number,
): string {
  const age = profile.date_of_birth
    ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 'unknown'

  const ownsGear =
    typeof layer2Responses.owns_wetsuit === 'string' &&
    layer2Responses.owns_wetsuit.startsWith('Yes') &&
    typeof layer2Responses.owned_wetsuits === 'string' &&
    (layer2Responses.owned_wetsuits as string).trim().length > 0

  const ownedGearSection = ownsGear
    ? `The athlete already owns the following in this category: ${layer2Responses.owned_wetsuits}. Treat these as priority candidates.`
    : 'The athlete does not currently own gear in this category.'

  const locationLine = (profile.city ?? '').trim() || (profile.state ?? '').trim()
    ? `- Location: ${[profile.city, profile.state].filter(Boolean).join(', ')}`
    : '- Location: not specified'

  const appleSignals =
    layer2Responses.watch_type === 'I wear an Apple Watch and want to know if it works for triathlon' ||
    layer2Responses.brand_preference === 'Apple — want Apple Watch' ||
    (Array.isArray(layer2Responses.current_devices) &&
      (layer2Responses.current_devices as string[]).includes('Apple iPhone'))

  return `You are TriKit AI, an expert triathlon gear advisor. Your recommendations are personalized and grounded in real review data — not generic best-of lists.

ATHLETE PROFILE (Layer 1):
- Race distance(s): ${profile.race_distances?.join(', ') ?? 'not specified'}
- Experience: ${profile.experience_level ?? 'not specified'}
- Background sport: ${profile.background_sport ?? 'not specified'}
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
- Flexibility: ${profile.flexibility_level ?? 'not specified'}
- Current bike: ${profile.current_bike ?? 'not specified'}
- Foot width: ${profile.foot_width ?? 'not specified'}
- Arch type: ${profile.arch_type ?? 'not specified'}

RACE CONTEXT:
Use your knowledge of ${profile.target_race_name ?? "the athlete's race"} to inform the recommendation. Consider typical water temperature, swim type, bike terrain, run surface, expected weather, and wetsuit legality. If location is not specified, do not infer or assume a specific city, venue, or region — work only from what is explicitly stated.

CATEGORY-SPECIFIC INPUTS (Layer 2):
${Object.entries(layer2Responses).map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')}

OWNED GEAR IN THIS CATEGORY:
${ownedGearSection}

BUDGET RANGE: $${budgetMin} — ${budgetMax >= 999999 ? 'no upper limit' : `$${budgetMax}`}
${budgetMax >= 999999 ? 'The athlete has no upper budget constraint — recommend the best option for their profile regardless of price.' : 'This is a hard constraint. Only recommend products within this range.'}

AVAILABLE PRODUCTS:
${JSON.stringify(products, null, 2)}

PRODUCT AVAILABILITY:
Each product includes an availability_status field. Apply these rules strictly:
- "current": recommend freely — this is an in-production model
- "previous_gen": still purchasable but superseded by a newer model, often at a reduced price. Only recommend if (a) it is a strong profile match AND budget is a constraint, OR (b) no current model fits as well. When recommended, note it is a previous-generation model still available on the market.
- "limited": hard to find — closeout or grey market only. Include only if it is clearly the best profile match AND nothing current comes close. Always flag: "Availability should be verified before purchase — this model may be difficult to find new."
- Never penalize a product solely for being previous_gen if it genuinely fits the athlete better than current alternatives.

APPLE ECOSYSTEM:
${appleSignals
  ? `This athlete has indicated Apple ecosystem affiliation (iPhone owner, Apple Watch user, or explicit Apple brand preference). You MUST populate the "appleEcosystemNote" field in your JSON response. Write 2-3 candid sentences covering: (1) whether Apple Watch Ultra 3 was considered, (2) why it was or was not the top recommendation for this specific athlete's goals, and (3) what they would gain or give up relative to the top pick. Be honest and specific — do not be dismissive of Apple Watch, but do not oversell it either. Populate this field even if Apple Watch Ultra 3 IS the top recommendation.`
  : 'No Apple ecosystem signals detected. Set appleEcosystemNote to null.'}

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

STEP 4 — UPGRADE CHECK: After assigning topPick and runnerUp from owned gear, ask: does any non-owned product in AVAILABLE PRODUCTS offer a substantial, measurable improvement for this specific athlete? If yes AND within budget, populate upgradeOption. If not, omit upgradeOption entirely.

STEP 5 — SINGLE OWNED PRODUCT: If the athlete owns only one product, it becomes topPick (alreadyOwned: true). runnerUp may be a non-owned alternative.

STEP 6 — NO OWNED GEAR: Select topPick and runnerUp freely from AVAILABLE PRODUCTS. Set alreadyOwned: false on both.

GENDER AND VARIANT CAVEAT RULE:
When flagging fit concerns related to gender-specific cuts, first verify whether the brand offers gender-specific variants. Frame caveat conditionally: "if you have the men's/unisex version..." rather than stating a fit concern as fact.

LOCATION RULE:
Do not infer, assume, or name specific cities, venues, or regions beyond what the athlete has explicitly stated.

Return ONLY valid JSON:
{
  "topPick": {
    "productId": "uuid",
    "productName": "string",
    "priceUsd": 0,
    "alreadyOwned": false,
    "personalizedReason": "3-4 sentences referencing specific profile attributes",
    "keyStrengths": ["athlete-specific", "athlete-specific", "athlete-specific"],
    "oneHonestCaveat": "one sentence about a relevant limitation"
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
    "whyUpgrade": "2-3 sentences",
    "keyImprovement": "one phrase"
  },
  "profileSpecificWarnings": ["string"],
  "sourcesDrawnFrom": ["source name 1"],
  "confidenceLevel": "high|medium|low",
  "lowConfidenceReason": "only if confidence is medium or low",
  "appleEcosystemNote": "2-3 sentences when Apple signals present | null when no Apple signals"
}`
}

// ---------------------------------------------------------------------------
// Product fetcher (mirrors getProductsWithReviewsForRecommendation in gear.ts)
// ---------------------------------------------------------------------------

async function fetchProducts(categorySlug: string, budgetMin: number, budgetMax: number) {
  const { data, error } = await supabase
    .from('gear_products')
    .select(
      'id, category_id, sub_category, name, brand, model, price_usd, price_range, price_tier, buoyancy_profile, swimmer_level, race_distance_focus, gender_category, image_path, specs, best_for, not_ideal_for, overall_rating, review_count, is_active, model_year, availability_status, created_at, gear_categories!inner(name, slug), review_sources(id, product_id, source_name, source_url, source_type, review_date, sentiment, key_points, full_summary, flexibility_score, buoyancy_score, comfort_score, durability_score, value_score, created_at)'
    )
    .eq('gear_categories.slug', categorySlug)
    .eq('is_active', true)
    .gte('price_usd', budgetMin)
    .lte('price_usd', budgetMax >= 999999 ? 99999 : budgetMax)
    .order('overall_rating', { ascending: false })
    .limit(20)

  if (error) {
    throw new Error(`Product fetch failed: ${error.message}`)
  }

  return data ?? []
}

// ---------------------------------------------------------------------------
// Test cases
// ---------------------------------------------------------------------------

const STUB_IDS = {
  userId: '00000000-0000-0000-0000-000000000000',
  profileId: '00000000-0000-0000-0000-000000000001',
}

const TEST_CASES: TestCase[] = [

  // ── GPS WATCHES ──────────────────────────────────────────────────────────

  {
    id: 'alex-gps',
    athleteName: 'Alex (Budget Beginner)',
    category: 'gps-watches',
    notes: 'Tests budget floor, entry-level recommendation. Already owns a GPS watch — should surface upgrade context.',
    budgetMin: 150,
    budgetMax: 350,
    layer2: {
      triathlon_mode: 'Yes — I need triathlon mode (swim → bike → run sequencing)',
      watch_type: 'Dedicated sports/triathlon watch — performance and accuracy first',
      longest_event: 'Sprint triathlon — under 2 hours',
      power_meter: "No and I don't plan to",
      multi_bike_setup: 'No — single bike setup',
      navigation_importance: 'Not important — I train on familiar routes',
      recovery_metrics: 'Somewhat — nice to have alongside training data',
      current_devices: ['Apple iPhone'],
      // Apple note should fire: iPhone owner
    },
    profile: {
      id: STUB_IDS.profileId,
      user_id: STUB_IDS.userId,
      race_distances: ['Sprint'],
      experience_level: 'This is my first season',
      background_sport: 'Cycling',
      gender: 'Male',
      date_of_birth: '1996-03-14',
      city: 'Columbus',
      state: 'OH',
      height_feet: 5,
      height_inches: 10,
      weight_lbs: 165,
      budget_style: 'Value-focused — I want the best bang for my buck',
      fit_issues: [],
      existing_gear: ['GPS watch'],
      local_vs_travel: 'Mostly local',
      racing_season: 'Summer (June–August)',
      target_race_name: 'Columbus Sprint Triathlon',
      target_race_date: '2026-07-12',
      inseam_inches: 31,
      torso_length_inches: 24,
      arm_span_inches: 70,
      shoulder_width_inches: 17,
      flexibility_level: 'Average',
      current_bike: 'Entry aluminum road bike',
      foot_width: 'Standard / medium',
      arch_type: 'Neutral arch',
    },
  },

  {
    id: 'priya-gps',
    athleteName: 'Priya (Data Maximizer)',
    category: 'gps-watches',
    notes: 'Tests performance-first with power meter + Garmin preference. Should recommend flagship Garmin.',
    budgetMin: 400,
    budgetMax: 800,
    layer2: {
      triathlon_mode: 'Yes — I need triathlon mode (swim → bike → run sequencing)',
      watch_type: 'Dedicated sports/triathlon watch — performance and accuracy first',
      longest_event: '70.3 Half Ironman — 4–7 hours',
      power_meter: 'Yes — I need the watch to display and record power data',
      multi_bike_setup: 'No — single bike setup',
      navigation_importance: 'Essential — I regularly ride or run new routes and need turn-by-turn',
      chest_strap_hr: 'Yes — I rely on chest strap accuracy for training zones',
      recovery_metrics: 'Very — I want HRV, body battery, sleep tracking, and stress scores',
      brand_preference: 'Garmin — already in the ecosystem or prefer it',
      current_devices: ['Garmin Edge cycling computer'],
    },
    profile: {
      id: STUB_IDS.profileId,
      user_id: STUB_IDS.userId,
      race_distances: ['70.3 Half Ironman'],
      experience_level: '3+ years',
      background_sport: 'Cycling',
      gender: 'Female',
      date_of_birth: '1991-06-18',
      city: 'San Jose',
      state: 'CA',
      height_feet: 5,
      height_inches: 6,
      weight_lbs: 132,
      budget_style: 'Performance-first — I want the best available',
      fit_issues: [],
      existing_gear: ['Power meter', 'Carbon bike', 'Tri suit'],
      local_vs_travel: 'Travel',
      racing_season: 'Summer',
      target_race_name: 'Ironman 70.3 Santa Cruz',
      target_race_date: '2026-09-27',
      inseam_inches: 30,
      torso_length_inches: 24,
      arm_span_inches: 66,
      shoulder_width_inches: 16,
      flexibility_level: 'Average',
      current_bike: 'Aero road bike',
      foot_width: 'Standard',
      arch_type: 'Neutral',
    },
  },

  {
    id: 'marcus-gps',
    athleteName: 'Marcus (No Limit, Apple Ecosystem)',
    category: 'gps-watches',
    notes: 'Tests no-budget-cap + Apple ecosystem pathway. Apple note must fire. Should explain why Apple Watch was/was not top pick.',
    budgetMin: 0,
    budgetMax: 999999,
    layer2: {
      triathlon_mode: 'Yes — I need triathlon mode (swim → bike → run sequencing)',
      watch_type: 'Balanced — solid sports features AND everyday smartwatch usability',
      longest_event: 'Olympic triathlon — 2–3 hours',
      power_meter: "No and I don't plan to",
      multi_bike_setup: 'Yes — I ride outdoors and also use a smart trainer indoors',
      navigation_importance: 'Not important — I train on familiar routes',
      recovery_metrics: 'Not important — I just want training and race metrics',
      current_devices: ['Apple iPhone', 'Zwift or smart trainer setup'],
      brand_preference: 'Apple — want Apple Watch',
      apple_ecosystem_preference: 'Stay in Apple — show me the best Apple Watch option with honest triathlon tradeoffs',
    },
    profile: {
      id: STUB_IDS.profileId,
      user_id: STUB_IDS.userId,
      race_distances: ['Olympic'],
      experience_level: '1–3 years',
      background_sport: 'Rowing',
      gender: 'Male',
      date_of_birth: '1980-11-17',
      city: 'New York',
      state: 'NY',
      height_feet: 6,
      height_inches: 1,
      weight_lbs: 188,
      budget_style: 'No real budget limits — prioritize performance and durability',
      fit_issues: [],
      existing_gear: ['Smart trainer', 'Carbon shoes'],
      local_vs_travel: 'Travel',
      racing_season: 'Summer',
      target_race_name: 'NYC Olympic Triathlon',
      target_race_date: '2026-07-26',
      inseam_inches: 34,
      torso_length_inches: 27,
      arm_span_inches: 76,
      shoulder_width_inches: 20,
      flexibility_level: 'Limited',
      current_bike: 'Carbon aero bike',
      foot_width: 'Standard',
      arch_type: 'High',
    },
  },

  {
    id: 'emily-gps',
    athleteName: 'Emily (Returning Runner, older watch)',
    category: 'gps-watches',
    notes: 'Tests mid-range Olympic athlete with existing older GPS watch. Should acknowledge upgrade context.',
    budgetMin: 250,
    budgetMax: 500,
    layer2: {
      triathlon_mode: 'Yes — I need triathlon mode (swim → bike → run sequencing)',
      watch_type: 'Balanced — solid sports features AND everyday smartwatch usability',
      longest_event: 'Olympic triathlon — 2–3 hours',
      power_meter: "No and I don't plan to",
      multi_bike_setup: 'No — single bike setup',
      navigation_importance: 'Useful — occasionally helpful for new routes',
      recovery_metrics: 'Somewhat — nice to have alongside training data',
      current_devices: ['Apple iPhone'],
      brand_preference: 'No preference — recommend the best for my needs',
    },
    profile: {
      id: STUB_IDS.profileId,
      user_id: STUB_IDS.userId,
      race_distances: ['Olympic'],
      experience_level: 'Returning after time off',
      background_sport: 'Running',
      gender: 'Female',
      date_of_birth: '1982-12-22',
      city: 'Minneapolis',
      state: 'MN',
      height_feet: 5,
      height_inches: 7,
      weight_lbs: 145,
      budget_style: 'Mid-range — quality matters but I am price conscious',
      fit_issues: [],
      existing_gear: ['Older GPS watch'],
      local_vs_travel: 'Local',
      racing_season: 'Summer',
      target_race_name: 'Lake Nokomis Olympic Triathlon',
      target_race_date: '2026-08-02',
      inseam_inches: 30,
      torso_length_inches: 24,
      arm_span_inches: 66,
      shoulder_width_inches: 16,
      flexibility_level: 'Average',
      current_bike: 'Entry road bike',
      foot_width: 'Standard',
      arch_type: 'Medium arch',
    },
  },

  {
    id: 'derek-gps',
    athleteName: 'Derek (High Volume Swimmer, 70.3)',
    category: 'gps-watches',
    notes: 'Tests swimmer background with performance-first + advanced metrics. Multi-bike (smart trainer). Should surface strong swim tracking notes.',
    budgetMin: 400,
    budgetMax: 700,
    layer2: {
      triathlon_mode: 'Yes — I need triathlon mode (swim → bike → run sequencing)',
      watch_type: 'Dedicated sports/triathlon watch — performance and accuracy first',
      longest_event: '70.3 Half Ironman — 4–7 hours',
      power_meter: 'Yes — I need the watch to display and record power data',
      multi_bike_setup: 'Yes — I ride outdoors and also use a smart trainer indoors',
      navigation_importance: 'Useful — occasionally helpful for new routes',
      chest_strap_hr: 'Not currently but open to it',
      recovery_metrics: 'Very — I want HRV, body battery, sleep tracking, and stress scores',
      current_devices: ['Zwift or smart trainer setup'],
      brand_preference: 'No preference — recommend the best for my needs',
    },
    profile: {
      id: STUB_IDS.profileId,
      user_id: STUB_IDS.userId,
      race_distances: ['70.3 Half Ironman'],
      experience_level: '1–3 years',
      background_sport: 'Swimming',
      gender: 'Male',
      date_of_birth: '1998-01-05',
      city: 'Tempe',
      state: 'AZ',
      height_feet: 5,
      height_inches: 11,
      weight_lbs: 160,
      budget_style: 'Performance-first — I want the best available',
      fit_issues: [],
      existing_gear: ['Smart watch'],
      local_vs_travel: 'Mix',
      racing_season: 'Spring',
      target_race_name: 'Ironman 70.3 Arizona',
      target_race_date: '2026-03-22',
      inseam_inches: 32,
      torso_length_inches: 26,
      arm_span_inches: 74,
      shoulder_width_inches: 19,
      flexibility_level: 'Excellent',
      current_bike: 'Entry aero bike',
      foot_width: 'Standard',
      arch_type: 'Neutral',
    },
  },

  // ── WETSUITS ─────────────────────────────────────────────────────────────

  {
    id: 'alex-wetsuit',
    athleteName: 'Alex (Budget Beginner)',
    category: 'wetsuits',
    notes: 'Tests budget floor for beginner. Value priority should dominate. Should NOT recommend elite suits.',
    budgetMin: 100,
    budgetMax: 350,
    layer2: {
      water_type: ['Lake or reservoir — calm flatwater'],
      water_temp: '65–70°F / 18–21°C — cool, wetsuit beneficial',
      wetsuit_permitted: 'Not sure — I need help checking',
      swim_conditions: 'Calm flatwater — no waves or current',
      sleeve_preference: "Help me decide — I'm not sure what's right for me",
      shoulder_mobility: 'Good — occasional tightness but not limiting',
      swim_ability: "Developing — I can complete the swim but it's not comfortable",
      wetsuit_experience: 'Never worn one',
      thermal_tendency: "Neutral — I'm comfortable in a range of temperatures",
      owns_wetsuit: 'No — I am buying new',
      priority: ['Value — best performance per dollar'],
      uses_per_season: '1–2 races only',
    },
    profile: {
      id: STUB_IDS.profileId,
      user_id: STUB_IDS.userId,
      race_distances: ['Sprint'],
      experience_level: 'This is my first season',
      background_sport: 'Cycling',
      gender: 'Male',
      date_of_birth: '1996-03-14',
      city: 'Columbus',
      state: 'OH',
      height_feet: 5,
      height_inches: 10,
      weight_lbs: 165,
      budget_style: 'Value-focused — I want the best bang for my buck',
      fit_issues: [],
      existing_gear: ['GPS watch'],
      local_vs_travel: 'Mostly local',
      racing_season: 'Summer',
      target_race_name: 'Columbus Sprint Triathlon',
      target_race_date: '2026-07-12',
      inseam_inches: 31,
      torso_length_inches: 24,
      arm_span_inches: 70,
      shoulder_width_inches: 17,
      flexibility_level: 'Average',
      current_bike: 'Entry aluminum road bike',
      foot_width: 'Standard / medium',
      arch_type: 'Neutral arch',
    },
  },

  {
    id: 'trevor-wetsuit',
    athleteName: 'Trevor (Clydesdale, 230 lbs)',
    category: 'wetsuits',
    notes: 'Tests extreme body type. 230 lbs + large calves — fit caveats and buoyancy priority must be surfaced. Leg entry and size availability are key.',
    budgetMin: 200,
    budgetMax: 550,
    layer2: {
      water_type: ['Lake or reservoir — calm flatwater'],
      water_temp: '65–70°F / 18–21°C — cool, wetsuit beneficial',
      wetsuit_permitted: 'Yes, confirmed wetsuit legal',
      swim_conditions: 'Calm flatwater — no waves or current',
      sleeve_preference: 'Full sleeve — I want maximum warmth and buoyancy',
      shoulder_mobility: 'Good — occasional tightness but not limiting',
      swim_ability: "Developing — I can complete the swim but it's not comfortable",
      wetsuit_experience: 'Never worn one',
      thermal_tendency: 'Cold — I get cold easily and need thermal protection',
      owns_wetsuit: 'No — I am buying new',
      priority: ['Buoyancy — I need help staying horizontal and afloat'],
      uses_per_season: '3–5 races',
    },
    profile: {
      id: STUB_IDS.profileId,
      user_id: STUB_IDS.userId,
      race_distances: ['70.3 Half Ironman'],
      experience_level: '1–3 years',
      background_sport: 'Football',
      gender: 'Male',
      date_of_birth: '1990-08-08',
      city: 'Charlotte',
      state: 'NC',
      height_feet: 6,
      height_inches: 3,
      weight_lbs: 230,
      budget_style: 'Mid-range — quality matters but I am price conscious',
      fit_issues: ['Large calves', 'Wide feet'],
      existing_gear: ['Bike', 'Basic trisuit'],
      local_vs_travel: 'Mix',
      racing_season: 'Fall',
      target_race_name: 'Beach2Battleship 70.3',
      target_race_date: '2026-10-24',
      inseam_inches: 35,
      torso_length_inches: 28,
      arm_span_inches: 79,
      shoulder_width_inches: 21,
      flexibility_level: 'Limited',
      current_bike: 'Endurance geometry bike',
      foot_width: 'Wide',
      arch_type: 'Low',
    },
  },

  {
    id: 'hannah-wetsuit',
    athleteName: 'Hannah (Open Water Anxiety, Ocean)',
    category: 'wetsuits',
    notes: 'Tests beginner + ocean swim + value budget. Buoyancy and confidence should dominate over speed. Price constraint real.',
    budgetMin: 100,
    budgetMax: 300,
    layer2: {
      water_type: ['Ocean or sea — open water, possible waves and surf'],
      water_temp: '65–70°F / 18–21°C — cool, wetsuit beneficial',
      wetsuit_permitted: 'Not sure — I need help checking',
      swim_conditions: 'Light chop — minor surface movement',
      sleeve_preference: 'Full sleeve — I want maximum warmth and buoyancy',
      shoulder_mobility: 'Excellent — full range of motion, no restrictions',
      swim_ability: 'Beginner — swimming is my weakest discipline, I need all the help I can get',
      wetsuit_experience: 'Never worn one',
      owns_wetsuit: 'No — I am buying new',
      priority: ['Buoyancy — I need help staying horizontal and afloat', 'Value — best performance per dollar'],
      uses_per_season: '1–2 races only',
    },
    profile: {
      id: STUB_IDS.profileId,
      user_id: STUB_IDS.userId,
      race_distances: ['Sprint'],
      experience_level: 'This is my first season',
      background_sport: 'Yoga',
      gender: 'Female',
      date_of_birth: '1994-04-01',
      city: 'Santa Monica',
      state: 'CA',
      height_feet: 5,
      height_inches: 5,
      weight_lbs: 125,
      budget_style: 'Value-focused — I want the best bang for my buck',
      fit_issues: [],
      existing_gear: ['Swimsuit'],
      local_vs_travel: 'Local',
      racing_season: 'Summer',
      target_race_name: 'Malibu Sprint Triathlon',
      target_race_date: '2026-09-12',
      inseam_inches: 29,
      torso_length_inches: 23,
      arm_span_inches: 65,
      shoulder_width_inches: 15,
      flexibility_level: 'Very flexible',
      current_bike: 'Hybrid bike',
      foot_width: 'Standard',
      arch_type: 'Neutral',
    },
  },

  {
    id: 'danielle-wetsuit',
    athleteName: 'Danielle (Petite Morphology)',
    category: 'wetsuits',
    notes: 'Tests petite frame fit — 5\'1", 108 lbs, narrow shoulders, short torso. Gender-specific variant caveat must appear. Flexibility priority.',
    budgetMin: 200,
    budgetMax: 550,
    layer2: {
      water_type: ['Lake or reservoir — calm flatwater'],
      water_temp: '65–70°F / 18–21°C — cool, wetsuit beneficial',
      wetsuit_permitted: 'Yes, confirmed wetsuit legal',
      swim_conditions: 'Calm flatwater — no waves or current',
      sleeve_preference: "Help me decide — I'm not sure what's right for me",
      shoulder_mobility: 'Excellent — full range of motion, no restrictions',
      swim_ability: 'Intermediate — solid swimmer, finishing is not a concern',
      wetsuit_experience: 'Worn a borrowed wetsuit',
      thermal_tendency: "Neutral — I'm comfortable in a range of temperatures",
      owns_wetsuit: 'No — I am buying new',
      priority: ["Flexibility — I don't want my stroke restricted at all"],
      uses_per_season: '3–5 races',
    },
    profile: {
      id: STUB_IDS.profileId,
      user_id: STUB_IDS.userId,
      race_distances: ['Olympic'],
      experience_level: '1–3 years',
      background_sport: 'Running',
      gender: 'Female',
      date_of_birth: '1987-09-03',
      city: 'Boulder',
      state: 'CO',
      height_feet: 5,
      height_inches: 1,
      weight_lbs: 108,
      budget_style: 'Mid-range — quality matters but I am price conscious',
      fit_issues: ['Short torso', 'Narrow shoulders'],
      existing_gear: ['Tri suit', 'GPS watch'],
      local_vs_travel: 'Mix',
      racing_season: 'Summer',
      target_race_name: 'Boulder Peak Triathlon',
      target_race_date: '2026-07-19',
      inseam_inches: 27,
      torso_length_inches: 20,
      arm_span_inches: 61,
      shoulder_width_inches: 14,
      flexibility_level: 'Very flexible',
      current_bike: 'XS endurance bike',
      foot_width: 'Narrow',
      arch_type: 'High arch',
    },
  },

  {
    id: 'sophie-wetsuit',
    athleteName: 'Sophie (Limited Shoulder Mobility)',
    category: 'wetsuits',
    notes: 'Tests shoulder constraint as primary fit driver. Should strongly steer toward sleeveless or low-restriction designs. Ocean swim context.',
    budgetMin: 200,
    budgetMax: 550,
    layer2: {
      water_type: ['Ocean or sea — open water, possible waves and surf'],
      water_temp: '65–70°F / 18–21°C — cool, wetsuit beneficial',
      wetsuit_permitted: 'Yes, confirmed wetsuit legal',
      swim_conditions: 'Light chop — minor surface movement',
      sleeve_preference: "Help me decide — I'm not sure what's right for me",
      shoulder_mobility: 'Limited — I have meaningful shoulder tightness that affects my stroke',
      swim_ability: 'Intermediate — solid swimmer, finishing is not a concern',
      wetsuit_experience: 'Worn a borrowed wetsuit',
      owns_wetsuit: 'No — I am buying new',
      priority: ["Flexibility — I don't want my stroke restricted at all"],
      uses_per_season: '3–5 races',
    },
    profile: {
      id: STUB_IDS.profileId,
      user_id: STUB_IDS.userId,
      race_distances: ['Olympic'],
      experience_level: '3+ years',
      background_sport: 'Pilates',
      gender: 'Female',
      date_of_birth: '1985-06-30',
      city: 'San Diego',
      state: 'CA',
      height_feet: 5,
      height_inches: 4,
      weight_lbs: 130,
      budget_style: 'Mid-range — quality matters but I am price conscious',
      fit_issues: ['Narrow shoulders'],
      existing_gear: ['Tri suit', 'Foam roller'],
      local_vs_travel: 'Mix',
      racing_season: 'Summer',
      target_race_name: 'San Diego International Triathlon',
      target_race_date: '2026-06-28',
      inseam_inches: 29,
      torso_length_inches: 22,
      arm_span_inches: 63,
      shoulder_width_inches: 14,
      flexibility_level: 'Excellent',
      current_bike: 'Endurance bike',
      foot_width: 'Narrow',
      arch_type: 'High',
    },
  },

  // ── ADDITIONAL FRINGE CASES ──────────────────────────────────────────────

  {
    id: 'carlos-gps',
    athleteName: 'Carlos (Full Ironman, Battery Priority)',
    category: 'gps-watches',
    notes: 'Tests 140.6 distance where battery life is the dominant constraint. Should surface watches with 20h+ GPS life and multi-day recovery tracking.',
    budgetMin: 300,
    budgetMax: 700,
    layer2: {
      triathlon_mode: 'Yes — I need triathlon mode (swim → bike → run sequencing)',
      watch_type: 'Dedicated sports/triathlon watch — performance and accuracy first',
      longest_event: 'Full Ironman — 10–17 hours',
      power_meter: "No and I don't plan to",
      multi_bike_setup: 'No — single bike setup',
      navigation_importance: 'Useful — occasionally helpful for new routes',
      chest_strap_hr: 'Yes — I rely on chest strap accuracy for training zones',
      recovery_metrics: 'Very — I want HRV, body battery, sleep tracking, and stress scores',
      current_devices: ['Android phone'],
      brand_preference: 'No preference — recommend the best for my needs',
    },
    profile: {
      id: STUB_IDS.profileId,
      user_id: STUB_IDS.userId,
      race_distances: ['Full Ironman'],
      experience_level: '3+ years',
      background_sport: 'Running',
      gender: 'Male',
      date_of_birth: '1983-02-19',
      city: 'Austin',
      state: 'TX',
      height_feet: 5,
      height_inches: 9,
      weight_lbs: 170,
      budget_style: 'Mid-range — quality matters but I am price conscious',
      fit_issues: [],
      existing_gear: ['Chest strap HR monitor', 'Carbon bike'],
      local_vs_travel: 'Travel',
      racing_season: 'Fall',
      target_race_name: 'Ironman Texas',
      target_race_date: '2026-04-25',
      inseam_inches: 31,
      torso_length_inches: 25,
      arm_span_inches: 71,
      shoulder_width_inches: 18,
      flexibility_level: 'Average',
      current_bike: 'Tri bike',
      foot_width: 'Standard',
      arch_type: 'Neutral',
    },
  },

  {
    id: 'ryan-wetsuit',
    athleteName: 'Ryan (Cold Water, Lake Tahoe)',
    category: 'wetsuits',
    notes: 'Tests sub-60°F cold water where thermal protection dominates. Should NOT recommend thin/flexibility-first wetsuits — warmth is the primary filter.',
    budgetMin: 200,
    budgetMax: 600,
    layer2: {
      water_type: ['Lake or reservoir — calm flatwater'],
      water_temp: 'Below 60°F / 15°C — very cold, maximum thermal protection needed',
      wetsuit_permitted: 'Yes, confirmed wetsuit legal',
      swim_conditions: 'Calm flatwater — no waves or current',
      sleeve_preference: 'Full sleeve — I want maximum warmth and buoyancy',
      shoulder_mobility: 'Good — occasional tightness but not limiting',
      swim_ability: 'Intermediate — solid swimmer, finishing is not a concern',
      wetsuit_experience: 'Worn a borrowed wetsuit',
      thermal_tendency: 'Cold — I get cold easily and need thermal protection',
      owns_wetsuit: 'No — I am buying new',
      priority: ['Warmth / thermal protection — I run cold and hypothermia is a real concern'],
      uses_per_season: '3–5 races',
    },
    profile: {
      id: STUB_IDS.profileId,
      user_id: STUB_IDS.userId,
      race_distances: ['Olympic'],
      experience_level: '1–3 years',
      background_sport: 'Running',
      gender: 'Male',
      date_of_birth: '1989-11-14',
      city: 'Reno',
      state: 'NV',
      height_feet: 5,
      height_inches: 11,
      weight_lbs: 158,
      budget_style: 'Mid-range — quality matters but I am price conscious',
      fit_issues: [],
      existing_gear: ['GPS watch'],
      local_vs_travel: 'Local',
      racing_season: 'Summer',
      target_race_name: 'Lake Tahoe Triathlon',
      target_race_date: '2026-08-16',
      inseam_inches: 32,
      torso_length_inches: 25,
      arm_span_inches: 72,
      shoulder_width_inches: 18,
      flexibility_level: 'Average',
      current_bike: 'Road bike',
      foot_width: 'Standard',
      arch_type: 'Neutral',
    },
  },

  {
    id: 'kate-wetsuit',
    athleteName: 'Kate (Owns Two Wetsuits, Comparison Mode)',
    category: 'wetsuits',
    notes: 'Tests the owned-gear comparison pathway. Athlete owns a Blueseventy Fusion and a Zone3 Aspire (both in DB) and wants to know which to race in. topPick must be one of the owned options (alreadyOwned: true). upgradeOption may appear if a non-owned suit is substantially better.',
    budgetMin: 0,
    budgetMax: 999999,
    layer2: {
      water_type: ['Lake or reservoir — calm flatwater'],
      water_temp: '65–70°F / 18–21°C — cool, wetsuit beneficial',
      wetsuit_permitted: 'Yes, confirmed wetsuit legal',
      swim_conditions: 'Calm flatwater — no waves or current',
      sleeve_preference: 'Full sleeve — I want maximum warmth and buoyancy',
      shoulder_mobility: 'Excellent — full range of motion, no restrictions',
      swim_ability: 'Advanced — swimming is my strongest discipline',
      wetsuit_experience: 'I own one or more wetsuits and race in them regularly',
      thermal_tendency: "Neutral — I'm comfortable in a range of temperatures",
      owns_wetsuit: 'Yes — I own two and want help deciding which to race in',
      owned_wetsuits: 'Blueseventy Fusion, Zone3 Aspire',
      priority: ["Speed — I'm racing for a time goal and want every advantage"],
      uses_per_season: '6+ races',
    },
    profile: {
      id: STUB_IDS.profileId,
      user_id: STUB_IDS.userId,
      race_distances: ['70.3 Half Ironman'],
      experience_level: '3+ years',
      background_sport: 'Swimming',
      gender: 'Female',
      date_of_birth: '1988-03-22',
      city: 'Denver',
      state: 'CO',
      height_feet: 5,
      height_inches: 6,
      weight_lbs: 135,
      budget_style: 'Performance-first — I want the best available',
      fit_issues: [],
      existing_gear: ['Blueseventy Fusion wetsuit', 'Zone3 Aspire wetsuit', 'Carbon tri bike'],
      local_vs_travel: 'Travel',
      racing_season: 'Summer',
      target_race_name: 'Ironman 70.3 Boulder',
      target_race_date: '2026-08-09',
      inseam_inches: 31,
      torso_length_inches: 24,
      arm_span_inches: 67,
      shoulder_width_inches: 16,
      flexibility_level: 'Excellent',
      current_bike: 'Carbon tri bike',
      foot_width: 'Standard',
      arch_type: 'Neutral',
    },
  },
]

// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------

function validate(
  result: Record<string, unknown>,
  testCase: TestCase,
  products: Array<{ price_usd: number }>,
): ValidationResult {
  const checks: { label: string; passed: boolean; detail?: string }[] = []

  // 1. Required fields present
  const required = ['topPick', 'runnerUp', 'profileSpecificWarnings', 'sourcesDrawnFrom', 'confidenceLevel']
  for (const field of required) {
    checks.push({
      label: `Required field: ${field}`,
      passed: field in result && result[field] !== null && result[field] !== undefined,
    })
  }

  // 2. Budget constraint
  const topPick = result.topPick as Record<string, unknown> | undefined
  const runnerUp = result.runnerUp as Record<string, unknown> | undefined

  if (testCase.budgetMax < 999999 && topPick) {
    const price = topPick.priceUsd as number
    checks.push({
      label: 'Top pick within budget',
      passed: price >= testCase.budgetMin && price <= testCase.budgetMax,
      detail: `$${price} vs $${testCase.budgetMin}–$${testCase.budgetMax}`,
    })
  }

  // 3. Profile attributes referenced in reason or keyStrengths
  const keyStrengthsText = ((topPick?.keyStrengths as string[]) ?? []).join(' ').toLowerCase()
  const reasonAndStrengths = ((topPick?.personalizedReason as string ?? '') + ' ' + keyStrengthsText).toLowerCase()
  const profileKeywords: string[] = []
  if (testCase.profile.weight_lbs > 200) profileKeywords.push(String(testCase.profile.weight_lbs))
  if (testCase.profile.fit_issues?.includes('Narrow shoulders')) profileKeywords.push('shoulder')
  if (testCase.profile.fit_issues?.includes('Large calves')) profileKeywords.push('cal')
  if (testCase.layer2.shoulder_mobility?.toString().includes('Limited')) profileKeywords.push('shoulder')
  // Accept "beginner", "first-season", or "first season" as valid signals for first-season athletes
  if (testCase.profile.experience_level?.includes('first season')) profileKeywords.push('first', 'beginner')

  if (profileKeywords.length > 0) {
    const uniqueKeywords = Array.from(new Set(profileKeywords))
    const found = uniqueKeywords.filter((kw) => reasonAndStrengths.includes(kw))
    checks.push({
      label: 'Profile attributes referenced in reasoning',
      passed: found.length > 0,
      detail: `Looking for: ${uniqueKeywords.join(', ')} — found: ${found.join(', ') || 'none'}`,
    })
  }

  // 4. Sources cited
  const sources = result.sourcesDrawnFrom as string[]
  checks.push({
    label: 'At least one source cited',
    passed: Array.isArray(sources) && sources.length > 0,
    detail: sources?.join(', '),
  })

  // 5. Apple note fires when expected
  const expectsApple =
    testCase.layer2.brand_preference === 'Apple — want Apple Watch' ||
    (Array.isArray(testCase.layer2.current_devices) &&
      testCase.layer2.current_devices.includes('Apple iPhone'))

  if (expectsApple) {
    const note = result.appleEcosystemNote as string | null
    checks.push({
      label: 'Apple ecosystem note present',
      passed: typeof note === 'string' && note.length > 20,
      detail: note ? note.slice(0, 80) + '...' : 'null or missing',
    })
  }

  // 6. Top pick is a real product in the pool
  if (topPick && products.length > 0) {
    const ids = products.map((p: Record<string, unknown>) => p.id as string)
    checks.push({
      label: 'Top pick ID exists in product pool',
      passed: ids.includes(topPick.productId as string),
      detail: `productId: ${topPick.productId}`,
    })
  }

  // 7. Comparison mode: if athlete owns gear, topPick should be alreadyOwned
  const ownsGear =
    typeof testCase.layer2.owns_wetsuit === 'string' &&
    testCase.layer2.owns_wetsuit.startsWith('Yes') &&
    typeof testCase.layer2.owned_wetsuits === 'string' &&
    (testCase.layer2.owned_wetsuits as string).trim().length > 0

  if (ownsGear && topPick) {
    checks.push({
      label: 'Comparison mode: topPick is alreadyOwned',
      passed: topPick.alreadyOwned === true,
      detail: `alreadyOwned: ${topPick.alreadyOwned}`,
    })
  }

  return {
    passed: checks.every((c) => c.passed),
    checks,
  }
}

// ---------------------------------------------------------------------------
// Single test runner
// ---------------------------------------------------------------------------

async function runTest(testCase: TestCase): Promise<{
  testCase: TestCase
  result: Record<string, unknown> | null
  validation: ValidationResult | null
  error: string | null
  durationMs: number
}> {
  const start = Date.now()
  console.log(`\n  Running: ${testCase.athleteName} / ${testCase.category}`)

  try {
    const products = await fetchProducts(testCase.category, testCase.budgetMin, testCase.budgetMax)

    if (products.length === 0) {
      return {
        testCase,
        result: null,
        validation: null,
        error: `No products found for ${testCase.category} in budget $${testCase.budgetMin}–$${testCase.budgetMax}`,
        durationMs: Date.now() - start,
      }
    }

    const prompt = buildTestPrompt(
      testCase.profile,
      testCase.layer2,
      products,
      testCase.budgetMin,
      testCase.budgetMax,
    )

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    const jsonText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const result = JSON.parse(jsonText) as Record<string, unknown>
    const validation = validate(result, testCase, products as Array<{ price_usd: number }>)

    console.log(`  ${validation.passed ? '✅' : '❌'} ${testCase.id} — ${Date.now() - start}ms`)
    return { testCase, result, validation, error: null, durationMs: Date.now() - start }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.log(`  ❌ ${testCase.id} — ERROR: ${error}`)
    return { testCase, result: null, validation: null, error, durationMs: Date.now() - start }
  }
}

// ---------------------------------------------------------------------------
// Result file writer
// ---------------------------------------------------------------------------

function writeResultFile(
  testCase: TestCase,
  result: Record<string, unknown> | null,
  validation: ValidationResult | null,
  error: string | null,
  durationMs: number,
  outputDir: string,
) {
  const topPick = result?.topPick as Record<string, unknown> | undefined
  const runnerUp = result?.runnerUp as Record<string, unknown> | undefined
  const appleNote = result?.appleEcosystemNote as string | null | undefined
  const warnings = result?.profileSpecificWarnings as string[] | undefined
  const sources = result?.sourcesDrawnFrom as string[] | undefined
  const upgradeOption = result?.upgradeOption as Record<string, unknown> | undefined

  const statusIcon = error ? '❌' : validation?.passed ? '✅' : '⚠️'
  const passCount = validation?.checks.filter((c) => c.passed).length ?? 0
  const totalCount = validation?.checks.length ?? 0

  const lines: string[] = [
    `# ${statusIcon} ${testCase.athleteName} — ${testCase.category}`,
    ``,
    `**Test ID:** \`${testCase.id}\`  `,
    `**Category:** ${testCase.category}  `,
    `**Budget:** $${testCase.budgetMin}–${testCase.budgetMax >= 999999 ? 'no limit' : '$' + testCase.budgetMax}  `,
    `**Duration:** ${durationMs}ms  `,
    `**Validation:** ${passCount}/${totalCount} checks passed  `,
    ``,
    `> **Test intent:** ${testCase.notes}`,
    ``,
    `---`,
    ``,
  ]

  if (error) {
    lines.push(`## ❌ Error`, ``, `\`\`\``, error, `\`\`\``, ``)
  } else {
    // Validation
    lines.push(`## Validation`)
    for (const check of validation?.checks ?? []) {
      lines.push(`- ${check.passed ? '✅' : '❌'} **${check.label}**${check.detail ? ` — ${check.detail}` : ''}`)
    }
    lines.push(``)

    // Top pick
    if (topPick) {
      lines.push(
        `## Top Pick: ${topPick.productName}`,
        ``,
        `**Price:** $${topPick.priceUsd}${topPick.alreadyOwned ? ' _(already owned)_' : ''}  `,
        `**Confidence:** ${result?.confidenceLevel}${result?.lowConfidenceReason ? ` — ${result.lowConfidenceReason}` : ''}`,
        ``,
        `### Personalized Reason`,
        String(topPick.personalizedReason),
        ``,
        `### Key Strengths`,
        ...(topPick.keyStrengths as string[]).map((s) => `- ${s}`),
        ``,
        `### Honest Caveat`,
        String(topPick.oneHonestCaveat),
        ``,
      )
    }

    // Runner up
    if (runnerUp) {
      lines.push(
        `## Runner Up: ${runnerUp.productName}`,
        ``,
        `**Price:** $${runnerUp.priceUsd}  `,
        ``,
        String(runnerUp.whyConsider),
        ``,
        `_Why not top: ${runnerUp.whyNotTop}_`,
        ``,
      )
    }

    // Upgrade option
    if (upgradeOption) {
      lines.push(
        `## Upgrade Option: ${upgradeOption.productName}`,
        ``,
        `**Price:** $${upgradeOption.priceUsd}  `,
        `**Key improvement:** ${upgradeOption.keyImprovement}`,
        ``,
        String(upgradeOption.whyUpgrade),
        ``,
      )
    }

    // Apple note
    if (appleNote) {
      lines.push(`## Apple Ecosystem Note`, ``, appleNote, ``)
    }

    // Profile notes
    if (warnings && warnings.length > 0) {
      lines.push(`## Profile Notes`, ``, ...warnings.map((w) => `- ${w}`), ``)
    }

    // Sources
    if (sources && sources.length > 0) {
      lines.push(`## Sources Cited`, ``, ...sources.map((s) => `- ${s}`), ``)
    }

    // Raw JSON
    lines.push(`## Raw JSON`, ``, `\`\`\`json`, JSON.stringify(result, null, 2), `\`\`\``, ``)
  }

  const filename = `${testCase.id}.md`
  fs.writeFileSync(path.join(outputDir, filename), lines.join('\n'))
}

// ---------------------------------------------------------------------------
// Summary writer
// ---------------------------------------------------------------------------

function writeSummary(
  results: Array<{
    testCase: TestCase
    result: Record<string, unknown> | null
    validation: ValidationResult | null
    error: string | null
    durationMs: number
  }>,
  outputDir: string,
) {
  const lines: string[] = [
    `# TriKit AI — Stress Test Summary`,
    ``,
    `**Run date:** ${new Date().toISOString()}  `,
    `**Total tests:** ${results.length}  `,
    `**Passed:** ${results.filter((r) => !r.error && r.validation?.passed).length}  `,
    `**Warnings:** ${results.filter((r) => !r.error && !r.validation?.passed).length}  `,
    `**Errors:** ${results.filter((r) => !!r.error).length}  `,
    ``,
    `---`,
    ``,
    `| Status | Test | Category | Budget | Checks | Time |`,
    `|---|---|---|---|---|---|`,
  ]

  for (const r of results) {
    const status = r.error ? '❌ Error' : r.validation?.passed ? '✅ Pass' : '⚠️ Warn'
    const passCount = r.validation?.checks.filter((c) => c.passed).length ?? 0
    const totalCount = r.validation?.checks.length ?? 0
    const budget = `$${r.testCase.budgetMin}–${r.testCase.budgetMax >= 999999 ? 'unlimited' : '$' + r.testCase.budgetMax}`
    lines.push(
      `| ${status} | [${r.testCase.athleteName}](./${r.testCase.id}.md) | ${r.testCase.category} | ${budget} | ${r.error ? 'N/A' : `${passCount}/${totalCount}`} | ${r.durationMs}ms |`
    )
  }

  lines.push(``, `---`, ``, `## What to Look For When Reviewing Results`, ``)
  lines.push(
    `- **Budget violations:** top pick price outside stated min/max`,
    `- **Generic reasoning:** personalizedReason doesn't mention the athlete's specific attributes`,
    `- **Missing Apple note:** iPhone/Apple-preference athletes should always have appleEcosystemNote`,
    `- **Wrong product pool:** top pick productId not recognized — indicates a product ID mismatch`,
    `- **Fit caveats missing:** Trevor (230 lbs, large calves) and Danielle (petite, narrow) should have fit-specific warnings`,
    `- **Shoulder steering:** Sophie's limited shoulder mobility should steer toward sleeveless or low-restriction wetsuits`,
    `- **Budget floor respected:** Hannah and Alex (both value-focused, $100–$300 range) must not get premium products`,
    ``,
  )

  // Diversity check: flag if most same-category tests returned the same top pick
  const categories = ['gps-watches', 'wetsuits'] as const
  lines.push(``, `---`, ``, `## Recommendation Diversity Check`, ``)

  for (const cat of categories) {
    const catResults = results.filter((r) => r.testCase.category === cat && !r.error && r.result)
    if (catResults.length < 2) continue

    const topPicks = catResults.map((r) => {
      const tp = r.result?.topPick as Record<string, unknown> | undefined
      return (tp?.productName as string) ?? 'unknown'
    })

    const counts: Record<string, number> = {}
    for (const name of topPicks) counts[name] = (counts[name] ?? 0) + 1

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    const [topName, topCount] = sorted[0]
    const dominanceRatio = topCount / catResults.length

    const diversityIcon = dominanceRatio >= 0.8 ? '🚨' : dominanceRatio >= 0.6 ? '⚠️' : '✅'
    lines.push(`### ${cat}`)
    lines.push(``)
    lines.push(`| Product | Times Recommended |`)
    lines.push(`|---|---|`)
    for (const [name, count] of sorted) {
      lines.push(`| ${name} | ${count}/${catResults.length} |`)
    }
    lines.push(``)
    lines.push(`${diversityIcon} **"${topName}"** was the top pick in ${topCount}/${catResults.length} tests (${Math.round(dominanceRatio * 100)}%)`)
    if (dominanceRatio >= 0.8) {
      lines.push(`> 🚨 HIGH DOMINANCE — one product is winning almost every test. Check whether the prompt is over-weighting review scores vs. profile fit, or whether the product pool is too thin.`)
    } else if (dominanceRatio >= 0.6) {
      lines.push(`> ⚠️ MODERATE DOMINANCE — one product is favored but not exclusively. Review the profiles that differ to confirm reasoning is genuinely personalized.`)
    } else {
      lines.push(`> Healthy spread — different profiles are yielding different recommendations.`)
    }
    lines.push(``)
  }

  fs.writeFileSync(path.join(outputDir, 'SUMMARY.md'), lines.join('\n'))
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2)
  const categoryFilter = args.find((a) => a.startsWith('--category='))?.split('=')[1]
    ?? (args.includes('--category') ? args[args.indexOf('--category') + 1] : null)
  const athleteFilter = args.find((a) => a.startsWith('--athlete='))?.split('=')[1]
    ?? (args.includes('--athlete') ? args[args.indexOf('--athlete') + 1] : null)

  let cases = TEST_CASES
  if (categoryFilter) cases = cases.filter((c) => c.category === categoryFilter)
  if (athleteFilter) cases = cases.filter((c) => c.id.includes(athleteFilter))

  const outputDir = path.join(process.cwd(), '..', 'product-ops', 'stress-tests', 'results')
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

  console.log(`\nTriKit AI Stress Test Runner`)
  console.log(`Tests to run: ${cases.length}`)
  console.log(`Output: ${outputDir}\n`)

  const allResults = []

  // Run sequentially to avoid rate limits
  for (const testCase of cases) {
    const r = await runTest(testCase)
    allResults.push(r)
    writeResultFile(testCase, r.result, r.validation, r.error, r.durationMs, outputDir)

    // Brief pause between calls to respect rate limits
    if (cases.indexOf(testCase) < cases.length - 1) {
      await new Promise((res) => setTimeout(res, 65000))
    }
  }

  writeSummary(allResults, outputDir)

  const passed = allResults.filter((r) => !r.error && r.validation?.passed).length
  const warned = allResults.filter((r) => !r.error && !r.validation?.passed).length
  const errored = allResults.filter((r) => !!r.error).length

  console.log(`\n─────────────────────────────`)
  console.log(`Results: ${passed} passed, ${warned} warnings, ${errored} errors`)
  console.log(`Summary: ${outputDir}/SUMMARY.md`)
  console.log(`─────────────────────────────\n`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
