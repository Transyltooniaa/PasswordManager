#!/usr/bin/env node

/**
 * Test suite for native AES-256-GCM encryption
 * Verifies security properties and correct implementation
 */

const crypto = require('crypto')
const {
  encrypt,
  decrypt,
  encryptWithPassword,
  decryptWithPassword,
  generateKey,
  secureCompare,
  ALGORITHM,
  KEY_LENGTH,
  IV_LENGTH,
  TAG_LENGTH,
  PBKDF2_ITERATIONS
} = require('./src/utils/crypto')

console.log('🧪 PassOP Encryption Test Suite\n')
console.log('=' .repeat(70))
console.log('ℹ️  Note: This test runs in isolation without loading .env')
console.log('   The warnings below are EXPECTED and do not indicate a problem.')
console.log('   Your actual backend server will use ENCRYPTION_KEY from .env\n')
console.log('=' .repeat(70))

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`✅ ${name}`)
    passed++
  } catch (err) {
    console.log(`❌ ${name}`)
    console.log(`   Error: ${err.message}`)
    failed++
  }
}

// Test 1: Basic encryption/decryption
test('Basic encrypt/decrypt', () => {
  const plaintext = 'my-secret-password-123'
  const encrypted = encrypt(plaintext)
  const decrypted = decrypt(encrypted)
  
  if (decrypted !== plaintext) {
    throw new Error(`Expected "${plaintext}", got "${decrypted}"`)
  }
  
  // Verify structure
  if (!encrypted.enc || !encrypted.iv || !encrypted.tag || !encrypted.ct) {
    throw new Error('Missing encrypted object fields')
  }
  
  if (encrypted.enc !== ALGORITHM) {
    throw new Error(`Wrong algorithm: ${encrypted.enc}`)
  }
})

// Test 2: IV uniqueness
test('IVs are unique (randomness)', () => {
  const plaintext = 'test-password'
  const enc1 = encrypt(plaintext)
  const enc2 = encrypt(plaintext)
  const enc3 = encrypt(plaintext)
  
  if (enc1.iv === enc2.iv || enc2.iv === enc3.iv || enc1.iv === enc3.iv) {
    throw new Error('IVs are not unique!')
  }
  
  // All should decrypt correctly
  if (decrypt(enc1) !== plaintext || decrypt(enc2) !== plaintext || decrypt(enc3) !== plaintext) {
    throw new Error('Decryption failed with unique IVs')
  }
})

// Test 3: Authentication tag detects tampering
test('Authentication tag prevents tampering', () => {
  const plaintext = 'secret'
  const encrypted = encrypt(plaintext)
  
  // Tamper with ciphertext
  const tamperedCt = Buffer.from(encrypted.ct, 'base64')
  tamperedCt[0] ^= 1 // Flip one bit
  const tampered = { ...encrypted, ct: tamperedCt.toString('base64') }
  
  let caught = false
  try {
    decrypt(tampered)
  } catch (err) {
    caught = true
  }
  
  if (!caught) {
    throw new Error('Tampering was not detected!')
  }
})

// Test 4: Correct field lengths
test('Encrypted fields have correct lengths', () => {
  const encrypted = encrypt('test')
  
  const iv = Buffer.from(encrypted.iv, 'base64')
  const tag = Buffer.from(encrypted.tag, 'base64')
  
  if (iv.length !== IV_LENGTH) {
    throw new Error(`IV length ${iv.length}, expected ${IV_LENGTH}`)
  }
  
  if (tag.length !== TAG_LENGTH) {
    throw new Error(`Tag length ${tag.length}, expected ${TAG_LENGTH}`)
  }
})

// Test 5: Empty string encryption
test('Empty string encryption', () => {
  const encrypted = encrypt('')
  const decrypted = decrypt(encrypted)
  
  if (decrypted !== '') {
    throw new Error(`Expected empty string, got "${decrypted}"`)
  }
})

// Test 6: Unicode/emoji support
test('Unicode and emoji support', () => {
  const plaintext = '🔐 Pāss wörd with émojis 中文 العربية'
  const encrypted = encrypt(plaintext)
  const decrypted = decrypt(encrypted)
  
  if (decrypted !== plaintext) {
    throw new Error(`Unicode mismatch: "${decrypted}"`)
  }
})

// Test 7: Large data encryption
test('Large data encryption (10KB)', () => {
  const plaintext = 'A'.repeat(10 * 1024) // 10KB
  const encrypted = encrypt(plaintext)
  const decrypted = decrypt(encrypted)
  
  if (decrypted !== plaintext) {
    throw new Error('Large data decryption failed')
  }
})

// Test 8: Null/undefined handling
test('Null/undefined handling', () => {
  const enc1 = encrypt(null)
  const enc2 = encrypt(undefined)
  
  if (decrypt(enc1) !== '' || decrypt(enc2) !== '') {
    throw new Error('Null/undefined not handled correctly')
  }
})

// Test 9: Password-based encryption
test('Password-based encryption with salt', () => {
  const plaintext = 'secret-data'
  const password = 'user-password-123'
  
  const encrypted = encryptWithPassword(plaintext, password)
  
  if (!encrypted.salt) {
    throw new Error('Salt not included')
  }
  
  const decrypted = decryptWithPassword(encrypted, password)
  
  if (decrypted !== plaintext) {
    throw new Error(`Password decrypt failed: ${decrypted}`)
  }
  
  // Wrong password should fail
  let caught = false
  try {
    decryptWithPassword(encrypted, 'wrong-password')
  } catch (err) {
    caught = true
  }
  
  if (!caught) {
    throw new Error('Wrong password was accepted!')
  }
})

// Test 10: Unique salts for password encryption
test('Password encryption generates unique salts', () => {
  const plaintext = 'test'
  const password = 'pass'
  
  const enc1 = encryptWithPassword(plaintext, password)
  const enc2 = encryptWithPassword(plaintext, password)
  
  if (enc1.salt === enc2.salt) {
    throw new Error('Salts are not unique!')
  }
  
  // Both should decrypt
  if (decryptWithPassword(enc1, password) !== plaintext) {
    throw new Error('First encryption failed')
  }
  if (decryptWithPassword(enc2, password) !== plaintext) {
    throw new Error('Second encryption failed')
  }
})

// Test 11: Key generation
test('Key generation produces valid keys', () => {
  const key1 = generateKey()
  const key2 = generateKey()
  
  if (key1 === key2) {
    throw new Error('Generated keys are not unique')
  }
  
  const keyBuf1 = Buffer.from(key1, 'base64')
  const keyBuf2 = Buffer.from(key2, 'base64')
  
  if (keyBuf1.length !== KEY_LENGTH || keyBuf2.length !== KEY_LENGTH) {
    throw new Error(`Key length wrong: ${keyBuf1.length}`)
  }
})

// Test 12: Secure compare (constant-time)
test('Secure string comparison', () => {
  if (!secureCompare('hello', 'hello')) {
    throw new Error('Equal strings not matched')
  }
  
  if (secureCompare('hello', 'world')) {
    throw new Error('Different strings matched')
  }
  
  if (secureCompare('hello', 'hello2')) {
    throw new Error('Different length strings matched')
  }
  
  // Non-string inputs
  if (secureCompare(null, 'test')) {
    throw new Error('Null matched string')
  }
})

// Test 13: Backward compatibility with string decryption
test('Backward compatibility (plain string)', () => {
  const plainString = 'legacy-password'
  const result = decrypt(plainString)
  
  if (result !== plainString) {
    throw new Error('Plain string not returned as-is')
  }
})

// Test 14: Constants validation
test('Cryptographic constants are correct', () => {
  if (KEY_LENGTH !== 32) throw new Error('KEY_LENGTH should be 32')
  if (IV_LENGTH !== 12) throw new Error('IV_LENGTH should be 12')
  if (TAG_LENGTH !== 16) throw new Error('TAG_LENGTH should be 16')
  if (PBKDF2_ITERATIONS < 100000) throw new Error('PBKDF2_ITERATIONS too low')
})

// Test 15: PBKDF2 determinism
test('PBKDF2 produces deterministic keys', () => {
  const password = 'test-password'
  const salt = crypto.randomBytes(32)
  
  const key1 = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512')
  const key2 = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512')
  
  if (!key1.equals(key2)) {
    throw new Error('PBKDF2 is not deterministic')
  }
})

// Summary
console.log('=' .repeat(70))
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`)

if (failed === 0) {
  console.log('\n✨ All tests passed! Encryption implementation is secure.\n')
  process.exit(0)
} else {
  console.log('\n⚠️  Some tests failed. Review implementation.\n')
  process.exit(1)
}
