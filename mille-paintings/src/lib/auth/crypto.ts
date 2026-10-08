/** Web Crypto helpers for local email/password accounts. */

function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function hexToBuffer(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

export async function randomSaltHex(bytes = 16): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(bytes))
  return bufferToHex(salt.buffer)
}

export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: hexToBuffer(saltHex) as BufferSource,
      iterations: 120_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )
  return bufferToHex(bits)
}

export async function verifyPassword(
  password: string,
  saltHex: string,
  expectedHash: string,
): Promise<boolean> {
  const actual = await hashPassword(password, saltHex)
  if (actual.length !== expectedHash.length) return false
  let diff = 0
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expectedHash.charCodeAt(i)
  return diff === 0
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))
}
