const crypto = require('crypto')

// Derive a 32-byte key. Prefer ENCRYPTION_KEY as base64; else derive with scrypt from SECRET.
function getKey() {
  const envKeyB64 = process.env.ENCRYPTION_KEY
  if (envKeyB64) {
    try { return Buffer.from(envKeyB64, 'base64') } catch {}
  }
  const secret = process.env.SECRET || 'passop_default_secret'
  // Deterministic key for development. In production, set ENCRYPTION_KEY.
  return crypto.scryptSync(secret, 'passop_salt', 32)
}

function encrypt(plaintext) {
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    enc: 'aes-256-gcm',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ct: ciphertext.toString('base64')
  }
}

function decrypt(encObj) {
  if (!encObj || typeof encObj !== 'object') return ''
  const key = getKey()
  const iv = Buffer.from(encObj.iv, 'base64')
  const tag = Buffer.from(encObj.tag, 'base64')
  const ciphertext = Buffer.from(encObj.ct, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plaintext.toString('utf8')
}

module.exports = { encrypt, decrypt }
