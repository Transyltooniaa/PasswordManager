/**
 * Native AES-256-GCM Encryption (No External Libraries)
 * 
 * Security Features:
 * - AES-256-GCM: Authenticated encryption with 256-bit keys
 * - PBKDF2: 100,000 iterations with SHA-512 for key derivation
 * - Random IV: 12 bytes (96 bits) per encryption, never reused
 * - Authentication Tag: 16 bytes (128 bits) ensures integrity
 * - Constant-time operations where possible
 * 
 * Format: { enc, iv, tag, ct, salt? }
 * - enc: Algorithm identifier ("aes-256-gcm")
 * - iv: Initialization vector (base64)
 * - tag: Authentication tag (base64)
 * - ct: Ciphertext (base64)
 * - salt: Optional salt for PBKDF2 (base64, if derived from password)
 */

const crypto = require('crypto')

// Constants for cryptographic parameters
const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 12 // 96 bits (recommended for GCM)
const TAG_LENGTH = 16 // 128 bits
const SALT_LENGTH = 32 // 256 bits for PBKDF2
const PBKDF2_ITERATIONS = 100000 // OWASP recommendation
const PBKDF2_DIGEST = 'sha512'

/**
 * Derive a cryptographic key from a password using PBKDF2
 * @param {string} password - User's password/secret
 * @param {Buffer} salt - Salt for key derivation
 * @returns {Buffer} 32-byte derived key
 */
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    PBKDF2_DIGEST
  )
}

/**
 * Get encryption key from environment or derive from secret
 * Priority:
 * 1. ENCRYPTION_KEY (base64-encoded 32-byte key) - RECOMMENDED for production
 * 2. SECRET (derives key with deterministic salt) - Development only
 * 3. Default fallback - Insecure, for testing only
 * 
 * @returns {Buffer} 32-byte encryption key
 */
function getKey() {
  // Option 1: Use pre-generated encryption key (most secure)
  const envKeyB64 = process.env.ENCRYPTION_KEY
  if (envKeyB64) {
    try {
      const key = Buffer.from(envKeyB64, 'base64')
      if (key.length === KEY_LENGTH) {
        return key
      }
      console.warn('⚠️  ENCRYPTION_KEY has wrong length, falling back to SECRET')
    } catch (err) {
      console.warn('⚠️  Invalid ENCRYPTION_KEY format, falling back to SECRET')
    }
  }

  // Option 2: Derive from SECRET (deterministic salt for backward compatibility)
  const secret = process.env.SECRET || process.env.AUTH_SECRET
  if (secret && secret.length >= 8) {
    // Use deterministic salt so same SECRET always produces same key
    // This allows decrypting existing data after restart
    const deterministicSalt = crypto
      .createHash('sha256')
      .update('passop_encryption_salt_v1')
      .digest()
    
    return deriveKey(secret, deterministicSalt)
  }

  // Option 3: Insecure fallback (development/testing only)
  console.warn('⚠️  WARNING: Using default encryption key. Set ENCRYPTION_KEY or SECRET in production!')
  const fallbackSalt = Buffer.from('passop_default_salt_v1_insecure')
  return deriveKey('passop_default_secret_insecure', fallbackSalt)
}

/**
 * Generate a cryptographically secure random key
 * Use this to create ENCRYPTION_KEY for production:
 * 
 * @example
 * const { generateKey } = require('./crypto')
 * const key = generateKey()
 * console.log('ENCRYPTION_KEY=' + key)
 * 
 * @returns {string} Base64-encoded 32-byte key
 */
function generateKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('base64')
}

/**
 * Encrypt plaintext using AES-256-GCM
 * 
 * @param {string} plaintext - Data to encrypt
 * @param {Object} options - Optional parameters
 * @param {Buffer} options.key - Custom encryption key (defaults to getKey())
 * @returns {Object} Encrypted object with { enc, iv, tag, ct }
 */
function encrypt(plaintext, options = {}) {
  if (plaintext === null || plaintext === undefined) {
    plaintext = ''
  }

  const key = options.key || getKey()
  
  // Generate random IV (NEVER reuse!)
  const iv = crypto.randomBytes(IV_LENGTH)
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH
  })
  
  // Encrypt
  const encrypted = Buffer.concat([
    cipher.update(String(plaintext), 'utf8'),
    cipher.final()
  ])
  
  // Get authentication tag
  const tag = cipher.getAuthTag()
  
  return {
    enc: ALGORITHM,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ct: encrypted.toString('base64')
  }
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * 
 * @param {Object} encObj - Encrypted object from encrypt()
 * @param {Object} options - Optional parameters
 * @param {Buffer} options.key - Custom decryption key (defaults to getKey())
 * @returns {string} Decrypted plaintext
 * @throws {Error} If authentication fails or data is tampered
 */
function decrypt(encObj, options = {}) {
  // Handle various input types
  if (!encObj) {
    return ''
  }
  
  // If it's already a plain string, return as-is (backward compatibility)
  if (typeof encObj === 'string') {
    return encObj
  }
  
  if (typeof encObj !== 'object') {
    throw new Error('Invalid encrypted object format')
  }
  
  // Validate required fields
  if (!encObj.iv || !encObj.tag || !encObj.ct) {
    console.warn('Missing encryption fields, returning empty string')
    return ''
  }
  
  try {
    const key = options.key || getKey()
    
    // Decode components
    const iv = Buffer.from(encObj.iv, 'base64')
    const tag = Buffer.from(encObj.tag, 'base64')
    const ciphertext = Buffer.from(encObj.ct, 'base64')
    
    // Validate lengths
    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length: ${iv.length}, expected ${IV_LENGTH}`)
    }
    if (tag.length !== TAG_LENGTH) {
      throw new Error(`Invalid tag length: ${tag.length}, expected ${TAG_LENGTH}`)
    }
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: TAG_LENGTH
    })
    
    // Set authentication tag
    decipher.setAuthTag(tag)
    
    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final() // Throws if authentication fails
    ])
    
    return decrypted.toString('utf8')
  } catch (err) {
    // Authentication failure or decryption error
    console.error('❌ Decryption failed:', err.message)
    throw new Error('Decryption failed: data may be corrupted or tampered')
  }
}

/**
 * Encrypt with password (generates unique salt per encryption)
 * Use this when you want to encrypt with a user-provided password
 * instead of the system encryption key
 * 
 * @param {string} plaintext - Data to encrypt
 * @param {string} password - User password
 * @returns {Object} Encrypted object with { enc, iv, tag, ct, salt }
 */
function encryptWithPassword(plaintext, password) {
  const salt = crypto.randomBytes(SALT_LENGTH)
  const key = deriveKey(password, salt)
  const result = encrypt(plaintext, { key })
  result.salt = salt.toString('base64')
  return result
}

/**
 * Decrypt with password
 * 
 * @param {Object} encObj - Encrypted object with salt
 * @param {string} password - User password
 * @returns {string} Decrypted plaintext
 */
function decryptWithPassword(encObj, password) {
  if (!encObj || !encObj.salt) {
    throw new Error('Missing salt for password-based decryption')
  }
  const salt = Buffer.from(encObj.salt, 'base64')
  const key = deriveKey(password, salt)
  return decrypt(encObj, { key })
}

/**
 * Securely compare two strings in constant time
 * Prevents timing attacks when comparing secrets
 * 
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} True if equal
 */
function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false
  }
  
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  
  // crypto.timingSafeEqual requires equal lengths
  if (bufA.length !== bufB.length) {
    // Still compare to prevent timing leaks on length
    crypto.timingSafeEqual(
      Buffer.alloc(32),
      Buffer.alloc(32)
    )
    return false
  }
  
  return crypto.timingSafeEqual(bufA, bufB)
}

module.exports = {
  encrypt,
  decrypt,
  encryptWithPassword,
  decryptWithPassword,
  generateKey,
  secureCompare,
  // Expose constants for testing/documentation
  ALGORITHM,
  KEY_LENGTH,
  IV_LENGTH,
  TAG_LENGTH,
  PBKDF2_ITERATIONS
}
