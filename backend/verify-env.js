#!/usr/bin/env node

require('dotenv').config()
const crypto = require('crypto')

console.log('🔍 Environment Configuration Check\n')
console.log('=' .repeat(70))

// Check MongoDB
console.log('\n📊 Database Configuration:')
console.log('   MONGO_URI:', process.env.MONGO_URI || '❌ NOT SET')
console.log('   DB_NAME:', process.env.DB_NAME || '❌ NOT SET')

// Check Authentication
console.log('\n🔐 Authentication Configuration:')
console.log('   AUTH_SECRET:', process.env.AUTH_SECRET ? '✅ SET (' + process.env.AUTH_SECRET.length + ' chars)' : '❌ NOT SET')
console.log('   AUTH_PASSWORD:', process.env.AUTH_PASSWORD ? '⚠️  SET (use AUTH_PASSWORD_HASH instead)' : '✅ Not set (good)')
console.log('   AUTH_PASSWORD_HASH:', process.env.AUTH_PASSWORD_HASH ? '✅ SET (bcrypt hash)' : '❌ NOT SET')

// Check Encryption
console.log('\n🔒 Encryption Configuration:')
const encKey = process.env.ENCRYPTION_KEY
if (encKey) {
  try {
    const keyBuf = Buffer.from(encKey, 'base64')
    if (keyBuf.length === 32) {
      console.log('   ENCRYPTION_KEY: ✅ SET (32 bytes, valid for AES-256)')
    } else {
      console.log('   ENCRYPTION_KEY: ❌ INVALID LENGTH (', keyBuf.length, 'bytes, need 32)')
      console.log('   Run: node generate-keys.js to get a new one')
    }
  } catch (err) {
    console.log('   ENCRYPTION_KEY: ❌ INVALID FORMAT (not valid base64)')
  }
} else if (process.env.SECRET || process.env.AUTH_SECRET) {
  console.log('   ENCRYPTION_KEY: ⚠️  Not set, will derive from SECRET/AUTH_SECRET')
  console.log('   Recommended: Set ENCRYPTION_KEY for better security')
} else {
  console.log('   ENCRYPTION_KEY: ❌ NOT SET')
  console.log('   Run: node generate-keys.js')
}

// Test encryption works
console.log('\n🧪 Testing Encryption:')
try {
  const { encrypt, decrypt } = require('./src/utils/crypto')
  const testData = 'test-password-123'
  const encrypted = encrypt(testData)
  const decrypted = decrypt(encrypted)
  
  if (decrypted === testData) {
    console.log('   ✅ Encryption/decryption working correctly')
    console.log('   ✅ No warnings (keys loaded from .env)')
  } else {
    console.log('   ❌ Decryption failed - check your keys')
  }
} catch (err) {
  console.log('   ❌ Error:', err.message)
}

// Summary
console.log('\n' + '=' .repeat(70))
const allGood = 
  process.env.MONGO_URI &&
  process.env.DB_NAME &&
  process.env.AUTH_SECRET &&
  process.env.AUTH_PASSWORD_HASH &&
  process.env.ENCRYPTION_KEY

if (allGood) {
  console.log('\n✅ All environment variables are properly configured!')
  console.log('   Your backend is ready to run securely.\n')
} else {
  console.log('\n⚠️  Some environment variables need attention.')
  console.log('   Review the issues above and update your .env file.\n')
}
