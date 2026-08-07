import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE, verifySessionToken } from './auth'

export async function isSignedIn(): Promise<boolean> {
  const store = await cookies()
  return verifySessionToken(store.get(SESSION_COOKIE)?.value)
}

/**
 * Authority check for anything that reads or mutates admin data. proxy.ts gates
 * /admin routes too, but server actions are directly addressable endpoints, so
 * they must not depend on the proxy having run.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isSignedIn())) redirect('/login')
}
