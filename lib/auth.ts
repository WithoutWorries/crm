import crypto from 'crypto'

const LEGACY_ITERATIONS = 100_000
const LEGACY_KEY_LEN = 64
const LEGACY_DIGEST = 'sha512'

const SCRYPT_N = 32_768
const SCRYPT_R = 8
const SCRYPT_P = 1
const SCRYPT_KEY_LEN = 64
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAX_MEMORY,
  })
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('hex')}$${hash.toString('hex')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  if (stored.startsWith('scrypt$')) {
    const [, nValue, rValue, pValue, saltHex, hashHex] = stored.split('$')
    const n = Number.parseInt(nValue, 10)
    const r = Number.parseInt(rValue, 10)
    const p = Number.parseInt(pValue, 10)
    if (!n || !r || !p || !saltHex || !hashHex || !/^[a-f0-9]+$/i.test(saltHex + hashHex)) {
      return false
    }

    try {
      const expected = Buffer.from(hashHex, 'hex')
      const computed = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, {
        N: n,
        r,
        p,
        maxmem: SCRYPT_MAX_MEMORY,
      })
      return computed.length === expected.length && crypto.timingSafeEqual(computed, expected)
    } catch {
      return false
    }
  }

  // Legacy PBKDF2 hashes are accepted once and upgraded after a successful login.
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const computed = crypto
    .pbkdf2Sync(password, salt, LEGACY_ITERATIONS, LEGACY_KEY_LEN, LEGACY_DIGEST)
    .toString('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computed, 'hex'))
  } catch {
    return false
  }
}

export function passwordNeedsUpgrade(stored: string): boolean {
  return !stored.startsWith(`scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$`)
}
