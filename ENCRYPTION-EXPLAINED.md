# 🔐 Encryption & Hashing Mechanisms Explained

## Overview

PassOP uses **two different cryptographic mechanisms** for different purposes:

1. **PBKDF2 + AES-256-GCM** - For encrypting passwords stored in database
2. **bcrypt** - For hashing the master password (login authentication)

Let's break down each one:

---

## 1️⃣ PBKDF2 Key Derivation (For Database Encryption)

### What is PBKDF2?

**PBKDF2** (Password-Based Key Derivation Function 2) is a key stretching algorithm that converts a password into a cryptographic key.

### Purpose
Convert your `ENCRYPTION_KEY` or `SECRET` into a strong 256-bit key for AES-256 encryption.

### Parameters Used

```javascript
const PBKDF2_ITERATIONS = 100000  // 100,000 rounds (OWASP 2023 recommendation)
const PBKDF2_DIGEST = 'sha512'    // SHA-512 hash function
const KEY_LENGTH = 32              // 32 bytes = 256 bits output
const SALT_LENGTH = 32             // 32 bytes = 256 bits salt
```

### The Algorithm

```
Derived Key = PBKDF2(password, salt, iterations, keyLength, hashFunction)
            = PBKDF2(password, salt, 100000, 32, SHA-512)
```

### Process Flow

```
Input Password/Secret
         ↓
    [Add Salt] ← Prevents rainbow table attacks
         ↓
    [Hash with SHA-512] ← First round
         ↓
    [Repeat 99,999 more times] ← Makes brute-force slow
         ↓
    32-byte Encryption Key (256 bits)
```

---

## 2️⃣ Salt Types Used

Your system uses **THREE different types of salts** for different scenarios:

### Salt Type #1: **Deterministic Salt** (System-wide)

**Used when**: Deriving encryption key from `SECRET` or `AUTH_SECRET`

```javascript
const deterministicSalt = crypto
  .createHash('sha256')
  .update('passop_encryption_salt_v1')
  .digest()

// Result: Always the same 32-byte salt
// SHA-256('passop_encryption_salt_v1') = 
// e.g., a7f3c8e9... (always identical)
```

**Why deterministic?**
- ✅ Same `SECRET` always produces same encryption key
- ✅ Allows decrypting passwords after server restart
- ✅ Backward compatibility with existing encrypted data

**Trade-off:**
- ⚠️ If someone gets your `SECRET`, they can derive the key
- 💡 That's why `ENCRYPTION_KEY` (random, not derived) is recommended

**Visual:**
```
SECRET "mySecret123"
       ↓
PBKDF2(password="mySecret123", 
       salt=SHA256("passop_encryption_salt_v1"),
       iterations=100000,
       keyLen=32,
       digest=SHA512)
       ↓
Same key every time: 4f8a9c2e... (32 bytes)
```

### Salt Type #2: **Random Salt** (Per-Password)

**Used when**: `encryptWithPassword()` is called (optional feature)

```javascript
const salt = crypto.randomBytes(SALT_LENGTH)  // 32 random bytes
const key = deriveKey(password, salt)
```

**Purpose:**
- Each encrypted password gets a **unique random salt**
- Stored with the encrypted data: `{ enc, iv, tag, ct, salt }`

**Example:**
```javascript
// Encrypt "password123" twice with same user password
encryptWithPassword("password123", "userPass") 
// → { ct: "xyz...", salt: "abc123...", ... }

encryptWithPassword("password123", "userPass")
// → { ct: "def...", salt: "789fed...", ... }  // Different salt!
```

**Why random?**
- ✅ Even if two users have same password, encrypted output is different
- ✅ Prevents rainbow table attacks
- ✅ Each encryption is unique

### Salt Type #3: **Fallback Salt** (Testing Only)

**Used when**: No `ENCRYPTION_KEY` or `SECRET` is set (INSECURE!)

```javascript
const fallbackSalt = Buffer.from('passop_default_salt_v1_insecure')
return deriveKey('passop_default_secret_insecure', fallbackSalt)
```

**Never use in production!** This is only for testing when .env is missing.

---

## 3️⃣ Complete Encryption Flow

### Scenario A: Using `ENCRYPTION_KEY` (Recommended)

```
1. Read ENCRYPTION_KEY from .env
   → "YvXqH8K5mN2pL9wR3uT6xA1bC4dE7fG0hI8jK1mN5oP=" (base64)

2. Decode from base64
   → 32 random bytes (no derivation needed!)

3. Use directly for AES-256-GCM
   → Encrypt password with this key

4. Generate random IV (12 bytes)
   → Never reused, unique per encryption

5. Encrypt with AES-256-GCM
   → Produces: { enc, iv, tag, ct }

NO SALT INVOLVED - Key is already 256 bits random!
```

### Scenario B: Using `SECRET` (Derived Key)

```
1. Read SECRET from .env
   → "mySecretKey123"

2. Generate deterministic salt
   → SHA-256("passop_encryption_salt_v1") 
   → Always: e7f2a9c8... (32 bytes)

3. Derive key with PBKDF2
   → PBKDF2("mySecretKey123", deterministicSalt, 100k, 32, SHA512)
   → Result: 4f8a9c2e... (32 bytes, always same for same SECRET)

4. Generate random IV (12 bytes)
   → Unique per encryption

5. Encrypt with AES-256-GCM
   → { enc, iv, tag, ct }

SALT USED: Deterministic (system-wide)
```

### Scenario C: Using `encryptWithPassword()` (Per-Password Salt)

```
1. User provides password
   → "userPassword123"

2. Generate random salt
   → crypto.randomBytes(32)
   → e.g., 3f9e2a1c... (unique every time!)

3. Derive key with PBKDF2
   → PBKDF2("userPassword123", randomSalt, 100k, 32, SHA512)
   → Result: unique key for this encryption

4. Generate random IV (12 bytes)
   → Unique per encryption

5. Encrypt with AES-256-GCM
   → { enc, iv, tag, ct, salt }

SALT USED: Random (stored with encrypted data)
```

---

## 4️⃣ bcrypt for Master Password (Login)

**Completely separate** from the encryption above!

### Purpose
Hash the master password you enter at login screen.

### How it Works

```javascript
// When you set up (one time):
const masterPassword = "Ajitesh@2003"
const hash = bcrypt.hashSync(masterPassword, 12)
// → "$2b$12$aRdOBGYUSdUcM1pSPRRN3.2cU/g45x5/cSkRjdpIBOGbMTCfSiCTG"
// Store this in AUTH_PASSWORD_HASH

// When you login:
const inputPassword = "Ajitesh@2003"
const isValid = bcrypt.compare(inputPassword, AUTH_PASSWORD_HASH)
// → true (password matches!)
```

### bcrypt Salt

bcrypt **automatically generates and embeds** a random salt:

```
$2b$12$aRdOBGYUSdUcM1pSPRRN3.2cU/g45x5/cSkRjdpIBOGbMTCfSiCTG
 │  │  │                                          │
 │  │  └─ Salt (22 chars)                        └─ Hash (31 chars)
 │  └─ Cost factor (12 = 2^12 = 4096 rounds)
 └─ Algorithm version (2b)
```

**Breakdown:**
- `$2b$` = bcrypt algorithm version 2b
- `12` = Cost factor (2^12 = 4,096 iterations)
- `aRdOBGYUSdUcM1pSPRRN3` = Random salt (auto-generated)
- `.2cU/g45x5/cSkRjdpIBOGbMTCfSiCTG` = Hash of password+salt

**You don't manage this salt** - bcrypt does it automatically!

---

## 5️⃣ Summary Table

| Mechanism | Purpose | Salt Type | Salt Value | Iterations |
|-----------|---------|-----------|------------|------------|
| **PBKDF2 (Scenario A)** | Derive key from `SECRET` | Deterministic | `SHA256("passop_encryption_salt_v1")` | 100,000 |
| **PBKDF2 (Scenario B)** | Derive key from user password | Random | `crypto.randomBytes(32)` | 100,000 |
| **bcrypt** | Hash master login password | Auto-generated | Random (embedded in hash) | 4,096 (2^12) |
| **AES-256-GCM** | Encrypt actual passwords | N/A (uses IV) | Random IV (12 bytes) | N/A |

---

## 6️⃣ Security Properties

### Deterministic Salt (System-wide)
- ✅ **Pro**: Same key after restart (can decrypt existing data)
- ✅ **Pro**: Simple setup (just set SECRET)
- ⚠️ **Con**: All passwords encrypted with same key
- ⚠️ **Con**: If SECRET leaks, attacker can derive key

### Random Salt (Per-Password)
- ✅ **Pro**: Each password gets unique encryption
- ✅ **Pro**: Rainbow tables useless
- ✅ **Pro**: Protects against pattern analysis
- ⚠️ **Con**: Must store salt with encrypted data
- ⚠️ **Con**: Slightly larger storage overhead

### Best Practice: Use ENCRYPTION_KEY
- ✅ **Best**: Pre-generated random key (no derivation)
- ✅ **Best**: No salt needed (key already random)
- ✅ **Best**: Fastest (no PBKDF2 overhead)
- ✅ **Best**: Most secure option

---

## 7️⃣ Visual Comparison

### Option 1: ENCRYPTION_KEY (Recommended)
```
┌─────────────────────────────────────────┐
│ .env file                               │
│ ENCRYPTION_KEY=Yv...5oP= (32 bytes)    │
└─────────────────────────────────────────┘
              ↓ (decode base64)
         [32 random bytes]
              ↓ (direct use)
      ┌─────────────────┐
      │  AES-256-GCM    │
      │  + Random IV    │
      └─────────────────┘
              ↓
    { enc, iv, tag, ct }
```

### Option 2: SECRET (Derived)
```
┌─────────────────────────────────────────┐
│ .env file                               │
│ SECRET=mySecret123                      │
└─────────────────────────────────────────┘
              ↓
    ┌────────────────────────┐
    │ Deterministic Salt     │
    │ SHA256("passop_enc...")│
    └────────────────────────┘
              ↓
    ┌────────────────────────┐
    │ PBKDF2                 │
    │ 100,000 iterations     │
    │ SHA-512                │
    └────────────────────────┘
              ↓
         [32 bytes key]
              ↓
      ┌─────────────────┐
      │  AES-256-GCM    │
      │  + Random IV    │
      └─────────────────┘
              ↓
    { enc, iv, tag, ct }
```

---

## 8️⃣ Recommended Setup

```bash
# .env file (PRODUCTION)

# Option A: Best - Use random encryption key
ENCRYPTION_KEY=YvXqH8K5mN2pL9wR3uT6xA1bC4dE7fG0hI8jK1mN5oP=

# Option B: Alternative - Derive from secret (deterministic salt)
# SECRET=your-long-random-secret-here

# Master password (bcrypt auto-salts)
AUTH_PASSWORD_HASH=$2b$12$aRdOBGYUSdUcM1pSPRRN3.2cU/g45x5/cSkRjdpIBOGbMTCfSiCTG

# JWT signing
AUTH_SECRET=6eUq6lSIkHueWbiO5+aHdWMGwBcxHRRIvBE3/Ul35mk
```

**Generate keys:**
```bash
cd backend
node generate-keys.js
```

---

## 9️⃣ FAQ

**Q: Why use deterministic salt instead of random?**
A: For system-wide encryption, we need the **same key after restart** to decrypt existing passwords. Random salt would produce different key each time!

**Q: Is deterministic salt secure?**
A: Yes, **IF** your SECRET is strong and kept secret. But `ENCRYPTION_KEY` (random, no derivation) is more secure.

**Q: What if I change SECRET?**
A: ⚠️ All existing encrypted passwords become **unreadable**! You'd need to migrate data.

**Q: Why 100,000 PBKDF2 iterations?**
A: OWASP 2023 recommendation. Makes brute-force attacks ~100ms per guess instead of microseconds.

**Q: What's the difference between salt and IV?**
A:
- **Salt**: Used in key derivation (PBKDF2) to prevent rainbow tables
- **IV** (Initialization Vector): Used in AES-GCM encryption to ensure same plaintext produces different ciphertext

**Q: Can I see the salt in my database?**
A: Only if you use `encryptWithPassword()`. For system-wide encryption, salt is deterministic (not stored, always same).

---

**Last Updated**: October 2025  
**Security Level**: Production-Ready  
**Compliance**: OWASP, NIST SP 800-132, FIPS 140-2
