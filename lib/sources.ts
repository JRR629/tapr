// Source-citation URL resolution.
//
// A recommendation/comparison lists its cited sources via the model's free-text
// `sourcesDrawnFrom`, while the clickable URLs come from our review data keyed by
// the exact DB `source_name`. The model frequently reproduces a name with slight
// drift — "Runner's World" vs "Runners World", "Believe in the Run (BITR)" vs
// "Believe in the Run", "DOCTORS OF RUNNING" vs "Doctors of Running" — which
// breaks a naive `urlMap[name]` lookup and leaves a dead, unclickable bubble
// (the reported bug: "some sources clickable, not all").
//
// `resolveSourceUrl` matches tolerantly (normalized + containment).
// `enrichCitedSources` attaches URLs, preserves any URL already present, and —
// when we actually have a URL map to match against — DROPS anything still
// unlinkable so every rendered bubble is clickable. Rationale: the URL map is
// built from ALL products sent to the model, so any *real* source it cites is in
// the map; a residual miss is almost always a hallucinated or malformed name,
// and an unclickable "source" is unverifiable — worse for trust than omitting
// it. When no map is available at all we keep the names (non-clickable) rather
// than hide the section entirely.

export type CitedSource = { name: string; url?: string }

// Accepts the looser shapes that live in saved records / model output, including
// `url: null` (some result types declare it) and bare strings.
type CitedSourceInput = string | { name: string; url?: string | null }

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ') // punctuation → space
    .trim()
    .replace(/\s+/g, ' ')
}

// Resolve one source name to a URL, tolerant of casing/punctuation drift and
// common suffix/prefix additions. Containment matching prefers the longest
// matching key so "Believe in the Run" doesn't accidentally win over a more
// specific key when both contain the target.
export function resolveSourceUrl(
  name: string,
  urlMap: Record<string, string>,
): string | undefined {
  if (urlMap[name]) return urlMap[name] // fast path: exact

  const target = normalize(name)
  if (!target) return undefined

  let bestKey: string | undefined
  let bestLen = 0
  for (const key of Object.keys(urlMap)) {
    const nk = normalize(key)
    if (!nk) continue
    if (nk === target) return urlMap[key] // normalized exact
    if (nk.includes(target) || target.includes(nk)) {
      if (nk.length > bestLen) {
        bestLen = nk.length
        bestKey = key
      }
    }
  }
  return bestKey ? urlMap[bestKey] : undefined
}

// Enrich a model-emitted sources array with URLs. Preserves URLs already
// attached (never clobbers stream-time enrichment), de-duplicates by normalized
// name, and drops unlinkable entries when a URL map is present.
export function enrichCitedSources(
  sources: Array<CitedSourceInput> | null | undefined,
  urlMap: Record<string, string>,
): CitedSource[] {
  if (!Array.isArray(sources)) return []
  const hasMap = Object.keys(urlMap).length > 0
  const out: CitedSource[] = []
  const seen = new Set<string>()

  for (const s of sources) {
    const name = typeof s === 'string' ? s : s?.name
    if (!name) continue

    const key = normalize(name)
    if (seen.has(key)) continue

    const existing = typeof s === 'string' ? undefined : s.url
    const url = existing ?? resolveSourceUrl(name, urlMap)

    // Unlinkable: drop only if we had data to match against; otherwise keep the
    // name so the sources section isn't silently emptied.
    if (!url && hasMap) continue

    seen.add(key)
    out.push(url ? { name, url } : { name })
  }

  return out
}
