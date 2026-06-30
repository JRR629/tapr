import type { Metadata } from 'next'
import { Bebas_Neue, DM_Sans, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.taprai.com').replace(/\/$/, '')
const TITLE = 'Tapr — AI gear recommendations for endurance athletes'
const DESCRIPTION =
  'AI-powered gear recommendations for endurance athletes — triathletes, runners, cyclists, swimmers. Built for serious athletes who want confident, specific advice.'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: TITLE,
  description: DESCRIPTION,
  // No global canonical here — a root-level canonical is inherited by every
  // child route and would wrongly point /privacy, /terms, /guides/* at '/'.
  // Add per-page canonicals individually if needed.
  openGraph: {
    type: 'website',
    siteName: 'Tapr',
    url: APP_URL,
    title: TITLE,
    description: DESCRIPTION,
    // TODO(post-launch): replace with a purpose-built 1200×630 share card.
    // Using the existing logo (720×345) as an interim OG image.
    images: [{ url: '/logo-email.png', width: 720, height: 345, alt: 'Tapr — Gear. Matched. Perfectly.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/logo-email.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#0A1628] text-white font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
