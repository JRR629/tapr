import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const classifications = JSON.parse(readFileSync('/Users/jonathanromeo/Desktop/Tapr/trikit-ai/classify-output.json'))

let success = 0, failed = 0

for (const product of classifications) {
  const { error } = await supabase
    .from('gear_products')
    .update({ swimmer_level: product.swimmer_level })
    .eq('id', product.id)

  if (error) {
    console.error(`❌ ${product.brand} ${product.name}: ${error.message}`)
    failed++
  } else {
    console.log(`✅ ${product.brand} ${product.name}: ${product.swimmer_level.join(', ')}`)
    success++
  }
}

console.log(`\nDone: ${success} updated, ${failed} failed`)
