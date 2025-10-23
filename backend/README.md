# PassOP Backend

Secure password manager backend built with Node.js, Express, and MongoDB.

## 🔐 Security Architecture

### Encryption System (Native AES-256-GCM)

**Zero external dependencies** - uses only Node.js built-in `crypto` module.

**Features:**
- **AES-256-GCM**: Authenticated encryption with 256-bit keys
- **PBKDF2**: 100,000 iterations with SHA-512 for key derivation  
- **Random IV**: 12 bytes generated per encryption, never reused
- **Authentication Tag**: 16 bytes ensures data integrity and authenticity
- **Constant-time operations**: Prevents timing attacks

**Encrypted Format:**
```javascript
{
  enc: 'aes-256-gcm',    // Algorithm identifier
  iv: 'base64-string',   // Initialization vector (12 bytes)
  tag: 'base64-string',  // Authentication tag (16 bytes)
  ct: 'base64-string'    // Ciphertext (variable length)
}
```

### Key Management

**Priority order:**
1. `ENCRYPTION_KEY` - Pre-generated 256-bit key (base64) - **RECOMMENDED**
2. `SECRET` or `AUTH_SECRET` - Derives key via PBKDF2
3. Default fallback - **INSECURE**, for testing only

**Generate secure keys:**
```bash
node backend/generate-keys.js
```

This outputs:
- `ENCRYPTION_KEY`: 256-bit key for data encryption
- `AUTH_SECRET`: JWT signing secret
- Instructions for bcrypt password hash

### Authentication

- **JWT tokens** with configurable expiration (default: 12h)
- **Master password** verification:
  - Production: `AUTH_PASSWORD_HASH` (bcrypt, 12 rounds)
  - Development: `AUTH_PASSWORD` (plaintext, not recommended)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running (local or remote)

### Setup

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Configure environment:**
```bash
cp ../.env.example .env
# Edit .env with your values
```

3. **Generate secure keys:**
```bash
node generate-keys.js
```

4. **Start server:**
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login with master password, get JWT token

### Passwords (Requires JWT)
- `GET /api/passwords` - List all passwords
- `POST /api/passwords` - Create new password
- `PUT /api/passwords/:id` - Update password
- `DELETE /api/passwords/:id` - Delete password

### Legacy (Backward Compatibility)
- `GET /` - List passwords (no auth)
- `POST /` - Create password
- `DELETE /` - Delete password

## 🔧 Environment Variables

```bash
# Database
MONGO_URI=mongodb://localhost:27017
DB_NAME=passop

# Encryption (choose ONE)
ENCRYPTION_KEY=<base64-32-bytes>  # RECOMMENDED
SECRET=<fallback-string>           # Alternative

# Authentication
AUTH_SECRET=<jwt-signing-secret>
AUTH_PASSWORD_HASH=<bcrypt-hash>   # RECOMMENDED
AUTH_PASSWORD=<plaintext>           # Development only

# Server
PORT=3000
NODE_ENV=production
```

## 🔄 Migration

Encrypt legacy plaintext passwords and add database indexes:

```bash
npm run migrate:encrypt
```

**What it does:**
- Converts plaintext passwords to AES-256-GCM encrypted format
- Adds indexes on `site`, `username`, `tags` for search performance
- Safe to run multiple times (idempotent)

## 🧪 Testing Encryption

```javascript
const { encrypt, decrypt, generateKey } = require('./src/utils/crypto')

// Generate a key
const key = generateKey()
console.log('ENCRYPTION_KEY=' + key)

// Encrypt
const encrypted = encrypt('my-secret-password')
console.log(encrypted)
// {
//   enc: 'aes-256-gcm',
//   iv: 'randomBase64...',
//   tag: 'authTagBase64...',
//   ct: 'ciphertextBase64...'
// }

// Decrypt
const plaintext = decrypt(encrypted)
console.log(plaintext) // 'my-secret-password'
```

## 🛡️ Security Best Practices

### Production Checklist
- [ ] Set `ENCRYPTION_KEY` (not `SECRET`)
- [ ] Use `AUTH_PASSWORD_HASH` (not `AUTH_PASSWORD`)
- [ ] Use strong `AUTH_SECRET` (32+ bytes)
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS/TLS in front of backend
- [ ] Restrict CORS to your frontend domain
- [ ] Enable MongoDB authentication
- [ ] Regular database backups
- [ ] Monitor for unusual activity
- [ ] Rotate keys periodically

### Key Rotation
1. Backup database
2. Generate new `ENCRYPTION_KEY`
3. Run migration script to re-encrypt with new key
4. Update environment variables
5. Restart services

### Security Notes
- Encryption keys derived from `SECRET` use deterministic salt for backward compatibility
- Same `SECRET` always produces same encryption key (allows decrypting after restart)
- `ENCRYPTION_KEY` provides better security isolation
- Authentication tag prevents tampering detection
- Decryption throws error if data is corrupted or tampered

## 📁 Project Structure

```
backend/
├── src/
│   ├── app.js                 # Express app setup
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   └── passwordController.js
│   ├── middleware/
│   │   └── auth.js            # JWT + password verification
│   ├── routes/
│   │   └── passwordRoutes.js
│   ├── services/
│   │   └── passwordService.js # Business logic
│   └── utils/
│       └── crypto.js          # ⭐ Native encryption (no libraries!)
├── scripts/
│   └── migrate-encrypt-and-index.js
├── generate-keys.js           # Key generation utility
├── server.js                  # Entry point
└── package.json
```

## 🐛 Troubleshooting

### Decryption fails after restart
- Ensure `ENCRYPTION_KEY` or `SECRET` hasn't changed
- Check that environment variables are loaded correctly

### "Invalid credentials" on login
- Verify `AUTH_PASSWORD_HASH` matches your password
- Test hash generation: `node -e "console.log(require('bcryptjs').hashSync('your-pass', 12))"`

### MongoDB connection fails
- Ensure MongoDB is running: `mongosh` or `mongo`
- Check `MONGO_URI` format: `mongodb://host:port`
- For Atlas: Use connection string from dashboard

### Performance issues
- Run migration to add indexes: `npm run migrate:encrypt`
- Check MongoDB slow queries: `db.setProfilingLevel(1)`

## 📚 Additional Resources

- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [AES-GCM Best Practices](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)
