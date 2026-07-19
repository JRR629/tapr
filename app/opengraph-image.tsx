import { ImageResponse } from 'next/og'

// Social share card for taprai.com (iMessage, LinkedIn, Facebook, X, Slack, …).
// Generated in code — no binary asset to maintain. Applies site-wide except for
// any route that defines its own opengraph-image.
export const alt = 'Tapr — AI-matched gear that fits your race'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Best-effort load of the brand display font. On any failure (e.g. no network at
// build time) we return null and fall back to a heavy sans, so the image — and
// the build — never break over a font fetch.
async function loadBebasNeue(): Promise<ArrayBuffer | null> {
  try {
    const cssRes = await fetch('https://fonts.googleapis.com/css2?family=Bebas+Neue', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TaprOG/1.0)' },
    })
    const css = await cssRes.text()
    const url = css.match(/src:\s*url\((https:[^)]+\.(?:ttf|otf|woff2?))\)/)?.[1]
    if (!url) return null
    return await (await fetch(url)).arrayBuffer()
  } catch {
    return null
  }
}

export default async function OpengraphImage() {
  const bebas = await loadBebasNeue()
  const displayFont = bebas ? 'Bebas Neue' : 'sans-serif'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          backgroundColor: '#0A1628',
          backgroundImage: 'radial-gradient(ellipse at top, #0F2040 0%, #0A1628 70%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          <div style={{ width: 18, height: 18, borderRadius: 999, backgroundColor: '#FF6B35' }} />
          <div style={{ fontSize: 26, letterSpacing: 6, color: '#FF6B35', fontWeight: 700 }}>
            {'AI-MATCHED ENDURANCE GEAR'}
          </div>
        </div>

        <div
          style={{
            fontFamily: displayFont,
            fontSize: 190,
            color: '#FFFFFF',
            lineHeight: 1,
            letterSpacing: bebas ? 6 : -6,
            fontWeight: 800,
          }}
        >
          {'TAPR'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 20 }}>
          <div style={{ fontSize: 58, color: '#FFFFFF', fontWeight: 700, lineHeight: 1.1 }}>
            {'Gear that fits your race.'}
          </div>
          <div style={{ fontSize: 58, color: '#FF6B35', fontWeight: 700, lineHeight: 1.1 }}>
            {'Not someone else’s.'}
          </div>
        </div>

        <div style={{ fontSize: 28, color: '#9CA3AF', marginTop: 44 }}>
          {'taprai.com  ·  Wetsuits · GPS Watches · Running Shoes · Nutrition'}
        </div>
      </div>
    ),
    {
      ...size,
      ...(bebas
        ? { fonts: [{ name: 'Bebas Neue', data: bebas, style: 'normal' as const, weight: 400 as const }] }
        : {}),
    }
  )
}
