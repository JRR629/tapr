/**
 * Converts Tapr logo text elements to SVG path outlines.
 * Run: node scripts/generate-logo-paths.mjs
 * Outputs: public/logo.svg, public/logo-sidebar.svg, public/logo-email-src.svg
 */

import pkg from 'opentype.js'
import { readFileSync, writeFileSync } from 'fs'

const ARIAL_BLACK = '/System/Library/Fonts/Supplemental/Arial Black.ttf'
const ARIAL = '/System/Library/Fonts/Supplemental/Arial.ttf'

const heavy = pkg.parse(readFileSync(ARIAL_BLACK).buffer)
const regular = pkg.parse(readFileSync(ARIAL).buffer)

// Return path data for a single glyph centered horizontally at (cx, baseline)
function glyphPath(font, char, cx, y, fontSize) {
  const scale = fontSize / font.unitsPerEm
  const glyph = font.charToGlyph(char)
  const x = cx - (glyph.advanceWidth * scale) / 2
  return glyph.getPath(x, y, fontSize).toPathData(3)
}

// Return concatenated path elements for a text string, centered at (cx, baseline)
// with explicit letter-spacing added between advances
function textPaths(font, text, cx, y, fontSize, letterSpacing, fill) {
  const scale = fontSize / font.unitsPerEm

  // First pass: compute total advance width including spacing
  let totalWidth = 0
  for (let i = 0; i < text.length; i++) {
    const g = font.charToGlyph(text[i])
    totalWidth += g.advanceWidth * scale
    if (i < text.length - 1) totalWidth += letterSpacing
  }

  // Second pass: draw from left edge of centered run
  let x = cx - totalWidth / 2
  const parts = []
  for (let i = 0; i < text.length; i++) {
    const g = font.charToGlyph(text[i])
    const d = g.getPath(x, y, fontSize).toPathData(3)
    if (d) parts.push(`<path d="${d}" fill="${fill}"/>`)
    x += g.advanceWidth * scale + letterSpacing
  }
  return parts.join('\n    ')
}

// Shared elements across all variants
const BARS = `
  <rect x="159" y="56"  width="80" height="154" fill="#FF6B35" rx="4"/>
  <rect x="253" y="74"  width="80" height="136" fill="#FF6B35" rx="4"/>
  <rect x="347" y="92"  width="80" height="118" fill="#FF6B35" rx="4"/>
  <rect x="441" y="110" width="80" height="100" fill="#FF6B35" rx="4"/>`

const LETTERS = `
  <path d="${glyphPath(heavy, 'T', 199, 183, 68)}" fill="#ffffff"/>
  <path d="${glyphPath(heavy, 'a', 293, 183, 68)}" fill="#ffffff"/>
  <path d="${glyphPath(heavy, 'p', 387, 183, 68)}" fill="#ffffff"/>
  <path d="${glyphPath(heavy, 'r', 481, 183, 68)}" fill="#ffffff"/>`

// Tagline for email/full logo (font-size 22, letter-spacing 3)
const TAGLINE_FULL = `
  ${textPaths(regular, 'GEAR. MATCHED. PERFECTLY.', 340, 245, 22, 3, '#FF6B35')}`

// Tagline for sidebar (same specs, same y — sidebar viewBox crops tight)
const TAGLINE_SIDEBAR = TAGLINE_FULL

// ── logo.svg (full logo with navy background, viewBox 0 0 680 260) ──────────
const logoFull = `<svg width="600" height="260" viewBox="0 0 680 260" xmlns="http://www.w3.org/2000/svg">
  <rect width="680" height="260" fill="#0A1628" rx="12"/>
${BARS}
${LETTERS}
${TAGLINE_FULL}
</svg>`

// ── logo-sidebar.svg (no background, tight crop) ─────────────────────────────
const logoSidebar = `<svg width="420" height="215" viewBox="130 46 420 215" xmlns="http://www.w3.org/2000/svg">
${BARS}
${LETTERS}
${TAGLINE_SIDEBAR}
</svg>`

// ── logo-email-src.svg (navy bg, wider viewBox for email padding) ─────────────
const logoEmail = `<svg width="480" height="230" viewBox="100 36 480 230" xmlns="http://www.w3.org/2000/svg">
  <rect x="100" y="36" width="480" height="230" fill="#0A1628"/>
${BARS}
${LETTERS}
${TAGLINE_FULL}
</svg>`

const base = '/Users/jonathanromeo/Desktop/Tapr/tapr/public'
writeFileSync(`${base}/logo.svg`, logoFull)
writeFileSync(`${base}/logo-sidebar.svg`, logoSidebar)
writeFileSync(`${base}/logo-email-src.svg`, logoEmail)

console.log('✓ logo.svg')
console.log('✓ logo-sidebar.svg')
console.log('✓ logo-email-src.svg')
console.log('Run: npx sharp-cli -i public/logo-email-src.svg -o public/logo-email.png resize 720')
