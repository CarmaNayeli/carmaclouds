import type { Metadata } from 'next'
import './globals.css'
import CookieBanner from '@/components/CookieBanner'

export const metadata: Metadata = {
  title: 'CarmaClouds - Tabletop Gaming Tools',
  description: 'Browser extensions and tools for DiceCloud, Roll20, Owlbear Rodeo, and Foundry VTT',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  )
}
