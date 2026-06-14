export const SPORTS = ['triathlon', 'running', 'cycling', 'swimming'] as const
export type Sport = typeof SPORTS[number]

export const SPORT_LABELS: Record<Sport, string> = {
  triathlon: 'Triathlon',
  running: 'Running',
  cycling: 'Cycling',
  swimming: 'Swimming',
}

export const RACE_DISTANCES_BY_SPORT: Record<Sport, readonly string[]> = {
  triathlon: ['sprint', 'olympic', '70_3', 'ironman', 'ultra'],
  running: ['5k', '10k', 'half_marathon', 'marathon', 'ultra_50k_plus'],
  cycling: ['crit', 'road_race', 'gran_fondo', 'gravel', 'century', 'ultra_endurance'],
  swimming: ['pool_meet', 'ow_1_3k', 'ow_5k_plus', 'masters', 'marathon_swim_10k_plus'],
}

export const DISTANCE_LABELS: Record<string, string> = {
  'tri:sprint': 'Sprint triathlon — under 2 hr',
  'tri:olympic': 'Olympic triathlon — 2–3 hr',
  'tri:70_3': '70.3 Half Ironman — 4–7 hr',
  'tri:ironman': 'Full Ironman — 9–17 hr',
  'tri:ultra': 'Ultra-distance triathlon — 17+ hr',
  'run:5k': '5K',
  'run:10k': '10K',
  'run:half_marathon': 'Half marathon',
  'run:marathon': 'Marathon',
  'run:ultra_50k_plus': 'Ultra-marathon (50K+)',
  'bike:crit': 'Criterium — under 1 hr (15–25 mi)',
  'bike:road_race': 'Road race — 1–3 hr (25–60 mi)',
  'bike:gran_fondo': 'Gran Fondo — 3–7 hr (60–120 mi)',
  'bike:gravel': 'Gravel — variable (50–200+ mi)',
  'bike:century': 'Century — 100 mi (5–10 hr)',
  'bike:ultra_endurance': 'Ultra-endurance — 200+ mi, multi-day',
  'swim:pool_meet': 'Pool meet',
  'swim:ow_1_3k': 'Open water 1–3K',
  'swim:ow_5k_plus': 'Open water 5K+',
  'swim:masters': 'Masters distance',
  'swim:marathon_swim_10k_plus': 'Marathon swim (10K+)',
}

export const SPORT_PREFIX: Record<Sport, string> = {
  triathlon: 'tri',
  running: 'run',
  cycling: 'bike',
  swimming: 'swim',
}

export function parseDistance(key: string): { sport: Sport; distance: string } | null {
  const [prefix, ...rest] = key.split(':')
  if (rest.length === 0) return null
  const sport = (Object.entries(SPORT_PREFIX).find(([_, p]) => p === prefix)?.[0]) as Sport | undefined
  if (!sport) return null
  return { sport, distance: rest.join(':') }
}

export function getDistanceLabel(key: string): string {
  return DISTANCE_LABELS[key] ?? key
}

export function distancesForSport(sport: Sport): string[] {
  return RACE_DISTANCES_BY_SPORT[sport].map((d) => `${SPORT_PREFIX[sport]}:${d}`)
}
