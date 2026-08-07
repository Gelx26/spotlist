import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'

/**
 * Gates the admin side. This is the first line only — server actions are
 * directly addressable, so each one also calls requireAdmin(). Public scan
 * pages (/p/...) and the QR image endpoint are deliberately not matched.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (verifySessionToken(token)) return NextResponse.next()

  const url = new URL('/login', request.url)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: '/admin/:path*',
}
