import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

const WETSUIT_CATEGORY_ID = 'f5cbccb3-5f95-48b9-b253-7fdb6c3ee7fe'
const { data: wetsuits, error } = await supabase
  .from('gear_products')
  .select('id, name, brand, price_tier, buoyancy_profile, best_for, not_ideal_for, review_sources(key_points, full_summary)')
  .eq('category_id', WETSUIT_CATEGORY_ID)
  .eq('is_active', true)
  .order('brand')

if (error) { console.error(error.message); process.exit(1) }
console.log(`Fetched ${wetsuits.length} active wetsuits. Sending to Claude...`)

const prompt = `Classify each triathlon wetsuit by swimmer level(s). Use: "beginner", "intermediate", "advanced".

Rules:
- beginner: maximum buoyancy, corrects sinking legs, suits marketed to first-timers/non-swimmers
- intermediate: balanced buoyancy+flexibility, good all-around, largest category
- advanced: flexibility-focused, minimal correction, assumes strong technique and body position
- Assign multiple when the suit genuinely spans levels
- Sleeveless: generally intermediate/advanced
- Use buoyancy_profile, best_for, and review signals — not price alone

Return ONLY a JSON array. Keep "r" (reasoning) to 5 words max:
[{"id":"...","brand":"...","name":"...","l":["beginner"|"intermediate"|"advanced"],"r":"5 words max"},...]

WETSUITS:
${JSON.stringify(wetsuits.map(w => ({
  id: w.id,
  brand: w.brand,
  name: w.name,
  pt: w.price_tier,
  bp: w.buoyancy_profile,
  bf: w.best_for?.slice(0, 2),
  ni: w.not_ideal_for?.slice(0, 1),
  rs: w.review_sources?.map(r => r.full_summary).filter(Boolean).slice(0, 1),
})), null, 2)}`

const message = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 16000,
  messages: [{ role: 'user', content: prompt }],
})

const raw = message.content[0].text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
const classifications = JSON.parse(raw)

console.log('\n' + '='.repeat(110))
console.log('SWIMMER LEVEL CLASSIFICATION — REVIEW BEFORE COMMITTING TO DB')
console.log('='.repeat(110))
console.log(`${'Brand'.padEnd(14)} ${'Name'.padEnd(38)} ${'Levels'.padEnd(32)} Reasoning`)
console.log('-'.repeat(110))
for (const c of classifications) {
  const levels = c.l.join(', ')
  console.log(`${c.brand.padEnd(14)} ${c.name.padEnd(38)} ${levels.padEnd(32)} ${c.r}`)
}
console.log('='.repeat(110))
console.log(`\nTotal: ${classifications.length} wetsuits classified`)

// Save in commit-ready format
const output = classifications.map(c => ({ id: c.id, brand: c.brand, name: c.name, swimmer_level: c.l, reasoning: c.r }))
writeFileSync('/Users/jonathanromeo/Desktop/Tapr/trikit-ai/classify-output.json', JSON.stringify(output, null, 2))
console.log('\nSaved to classify-output.json. Run commit-swimmer-level.mjs to write to DB after review.')
