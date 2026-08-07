import type { Metadata, Viewport } from 'next'
import './globals.css'

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
  themeColor: '#0b3b5c',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
