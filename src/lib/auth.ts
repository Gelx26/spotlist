import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

/**
 * Single-operator admin auth. No user table — the credential lives in env vars
 * and the password is stored only as a scrypt hash, so the plaintext is not
 * recoverable from the deployment.
 *
 * Kept free of `next/*` imports so it can be used from proxy.ts as well as
 * from server components and server actions.
 */

export const SESSION_COOKIE = 'spotlist_admin'
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000

/**
 * Format: scrypt:<saltHex>:<keyHex>
 *
 * Colon-separated, not `$`-separated: dotenv-expand treats `$abc` in a .env
 * file as a variable reference and silently expands it to an empty string.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const key = scryptSync(password, salt, 64)
  return `scrypt:${salt.toString('hex')}:${key.toString('hex')}`
}

function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  // timingSafeEqual throws on length mismatch, so compare digests of fixed size.
  const digestA = createHmac('sha256', 'compare').update(bufA).digest()
  const digestB = createHmac('sha256', 'compare').update(bufB).digest()
  return timingSafeEqual(digestA, digestB)
}

export function verifyPassword(password: string, stored: string | undefined): boolean {
  if (!stored) return false
  const [scheme, saltHex, keyHex] = stored.split(':')
  if (scheme !== 'scrypt' || !saltHex || !keyHex) return false

  const expected = Buffer.from(keyHex, 'hex')
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function verifyCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME
  const storedHash = process.env.ADMIN_PASSWORD_HASH
  if (!expectedUser || !storedHash) return false

  // Always run both checks so a wrong username is not faster than a wrong password.
  const userOk = constantTimeEquals(username, expectedUser)
  const passOk = verifyPassword(password, storedHash)
  return userOk && passOk
}

/** Stateless session token: "<expiryMs>.<hmac>". */
export function createSessionToken(now = Date.now()): string {
  const secret = requireSecret()
  const exp = String(now + SESSION_TTL_MS)
  const sig = createHmac('sha256', secret).update(exp).digest('base64url')
  return `${exp}.${sig}`
}

export function verifySessionToken(token: string | undefined, now = Date.now()): boolean {
  if (!token) return false
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) return false

  const [exp, sig] = token.split('.')
  if (!exp || !sig) return false
  if (!/^\d+$/.test(exp) || Number(exp) < now) return false

  const expected = createHmac('sha256', secret).update(exp).digest('base64url')
  return constantTimeEquals(sig, expected)
}

export function sessionMaxAgeSeconds(): number {
  return SESSION_TTL_MS / 1000
}

function requireSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set')
  return secret
}

/** True when the deployment has no credential configured at all. */
export function adminAuthConfigured(): boolean {
  return Boolean(
    process.env.ADMIN_USERNAME &&
      process.env.ADMIN_PASSWORD_HASH &&
      process.env.ADMIN_SESSION_SECRET,
  )
}
