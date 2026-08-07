import type { Metadata, Viewport } from 'next'
import { Fraunces, Archivo } from 'next/font/google'
import './globals.css'

// Old-style serif with a little age to it — the engraved plaque voice.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-fraunces',
  display: 'swap',
})

// Sturdy grotesque for everything operational.
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-archivo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'SpotList — Availability boards for buildings & parking',
    template: '%s | SpotList',
  },
  description:
    'Publish live availability for your buildings and parking lots, share it with a QR code, and collect availability requests straight to your contact person.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#14352c',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${archivo.variable}`}>
      <body>{children}</body>
    </html>
  )
}
