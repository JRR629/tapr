import type { Metadata } from 'next'
import { Bebas_Neue, DM_Sans, JetBrains_Mono } from 'next/font/google'
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

export const metadata: Metadata = {
  title: 'Tapr — Stop Guessing. Start Racing with the Right Gear.',
  description: 'Personalized triathlon gear recommendations powered by AI. Built for age-group triathletes who want confident, specific gear advice.',
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
      </body>
    </html>
  )
}
