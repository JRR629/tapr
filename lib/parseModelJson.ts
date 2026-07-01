import { jsonrepair } from 'jsonrepair'

// Robustly parse a JSON object emitted by an LLM. LLMs occasionally produce
// slightly-malformed JSON — most commonly an unescaped double-quote inside a
// string value (e.g. a height like 6'2" or a nested "quote"), which breaks
// JSON.parse mid-document. This helper:
//   1. strips markdown code fences,
//   2. extracts the outermost { … } (ignoring any prose around it),
//   3. tries a strict JSON.parse,
//   4. on failure, runs `jsonrepair` (fixes unescaped quotes, trailing commas,
//      minor truncation, etc.) and parses the repaired text.
// Throws if the text cannot be parsed even after repair — callers keep their
// try/catch to refund the credit and surface an error in that case.
//
// Isomorphic: used by both server routes and client hooks so every parse site
// behaves identically.
export function parseModelJson<T>(raw: string, onRepaired?: () => void): T {
  let text = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start) text = text.slice(start, end + 1)

  try {
    return JSON.parse(text) as T
  } catch {
    // jsonrepair throws if it cannot produce valid JSON — let that propagate.
    const repaired = jsonrepair(text)
    const result = JSON.parse(repaired) as T
    onRepaired?.()
    return result
  }
}
