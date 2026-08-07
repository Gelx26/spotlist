import { headers } from 'next/headers'

/**
 * Absolute origin of the running app, used to build the URL a property's QR
 * code encodes. Prefers an explicit env var, then the Vercel-provided host,
 * and finally the inbound request headers so local dev works untouched.
 */
export async function getAppUrl(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_APP_URL
  if (explicit) return explicit.replace(/\/$/, '')

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`

  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3005'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

export function publicListingPath(publicId: string): string {
  return `/p/${publicId}`
}
