import { randomBytes } from 'node:crypto'

// No look-alike characters (0/O, 1/I/l) so a public id stays readable if
// someone has to type it in from a printed sign instead of scanning the QR.
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz'

export function generatePublicId(length = 10): string {
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
  return out
}
