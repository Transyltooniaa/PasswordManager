
# PassOP — Secure Password Manager (Full Project Report)

Last updated: 27 Oct 2025

## 1. Project Overview

PassOP is a full‑stack password manager designed for simplicity, portability, and security. The application provides a modern React front end, a Node.js/Express backend, and a MongoDB datastore. Core security properties include authenticated encryption-at-rest (AES‑256‑GCM) using native Node crypto only, JWT-based session protection, and a hashed master password using bcrypt. The app is packaged for local development and containerized deployment (Docker + Nginx + Compose), with an optional CI path.

Target goals:
- Securely store website credentials with search, tags, and favicon hints.
- Require a master password to unlock and issue a JWT for authorized API calls.
- Encrypt all saved passwords at rest using AES‑256‑GCM; never store plaintext in DB.
- Keep the stack lightweight and auditable (no external crypto libraries).
- Offer a smooth UX: auto-lock on inactivity, responsive UI, and quick copy actions.


## 2. Architecture at a Glance

- Frontend: React + Vite (SPA) served by Nginx in production.
- Backend: Node.js + Express with MVC structure (routes/controllers/services).
- Database: MongoDB (native driver), one primary collection `passwords`.
- Security:
  - Authentication: bcrypt-hashed master password + JWT sessions.
  - Encryption: AES‑256‑GCM with 256‑bit key; IV=96 bits; tag=128 bits.
  - Key derivation: PBKDF2 (100k, SHA‑512) when deriving from a secret.
- Deployment: Dockerfiles for backend and web; Nginx reverse proxy `/api` → backend; docker‑compose for local orchestration.


## 3. Repository Tour and Key Files

Top-level files:
- `Dockerfile`: Builds frontend and serves via Nginx.
- `docker-compose.yml`: Spins up Mongo, backend, web, and mongo-express.
- `nginx.conf`: SPA static serving and `/api/*` proxy to backend:3000.
- `vite.config.js`, `eslint.config.js`: Dev tooling.
- `index.html`, `public/`, `src/`: Frontend app.
- `backend/`: Express server, encryption, Mongo logic.
- `SECURITY.md`, `ENCRYPTION-EXPLAINED.md`: In-depth security docs.

Backend (selected):
- `backend/server.js`: Loads env, starts Express app on `PORT`.
- `backend/src/app.js`: Wires middleware, routes, auth endpoints, and legacy fallbacks.
- `backend/src/config/db.js`: Mongo connection lifecycle (`connect`, `getDb`).
- `backend/src/routes/passwordRoutes.js`: REST routes for `/api/passwords`.
- `backend/src/controllers/passwordController.js`: Normalizes input, encrypts/decrypts, and validates payloads.
- `backend/src/services/passwordService.js`: MongoDB queries (list/create/update/delete).
- `backend/src/middleware/auth.js`: JWT sign/verify and bcrypt master password validation.
- `backend/src/utils/crypto.js`: Native AES‑256‑GCM + PBKDF2 utilities.
- `backend/package.json`: Scripts (dev, test, verify env).

Frontend (selected):
- `src/App.jsx`: App shell, AuthContext provider, idle auto‑lock logic.
- `src/components/Lock.jsx`: Master password login UI; fetches `/api/auth/login`.
- `src/components/Manager.jsx`: CRUD UI; search by site/username/tag; favicon hints.
- `src/components/Navbar.jsx`: Branding + sign out.
- `src/lib/apiBase.js`: Centralized API base resolver for dev/prod.


## 4. Data Model

Primary collection: `passwords`

Document shape (representative):
```
{
  id: string,                 // Client-generated UUID
  site: string,               // Normalized URL (ensures protocol)
  username: string,
  password: {                 // Encrypted object (AES-GCM)
    enc: "aes-256-gcm",
    iv: base64(12 bytes),
    tag: base64(16 bytes),
    ct: base64(variable)
  },
  tags: string[] | string,    // Stored as array or comma-separated
  icon: string,               // Preferred favicon URL
  createdAt: Date,
  updatedAt: Date
}
```

Notes:
- Password is never stored as plaintext; it’s encrypted before insert/update.
- For reads, the controller decrypts to show plaintext in the UI session.


## 5. Security Design and Hashing/Encryption Algorithms

### 5.1 Authentication (Login)
- The master password is hashed using bcrypt (cost configurable via hash).
- Server-side validation compares `bcrypt.compare(input, AUTH_PASSWORD_HASH)`.
- On success, server issues a JWT with a 12h expiry.
- Frontend stores the token in `localStorage` and attaches `Authorization: Bearer <token>` for API calls.

Key file: `backend/src/middleware/auth.js`
```
- sign(payload): jwt.sign(payload, AUTH_SECRET, { expiresIn: '12h' })
- verifyToken(req, res, next): Validates Authorization header; 401 on failure
- validatePassword(input):
    * If AUTH_PASSWORD_HASH is set → bcrypt.compare
    * Else if AUTH_PASSWORD is set → plain equality (dev fallback)
    * Else → deny (safe default)
```

Environment:
- `AUTH_PASSWORD_HASH` — bcrypt hash of the master password (recommended).
- `AUTH_SECRET` — JWT signing secret.

### 5.2 Encryption at Rest (Passwords)
- Algorithm: AES‑256‑GCM (authenticated encryption).
- Key: 32 bytes (256 bits). Sourced by precedence:
  1) `ENCRYPTION_KEY` (base64) — best practice for production.
  2) Derived via PBKDF2 from `SECRET`/`AUTH_SECRET` using a deterministic salt.
  3) Insecure fallback only for testing.
- IV: 12 bytes random per encryption (`crypto.randomBytes(12)`), never reused.
- Auth Tag: 16 bytes (128 bits) verified on decrypt.

Key file: `backend/src/utils/crypto.js`
- `encrypt(plaintext, { key? }) → { enc, iv, tag, ct }`
- `decrypt(encObj, { key? }) → plaintext` (throws on auth/tag mismatch)
- `deriveKey(password, salt) → 32-byte key` (PBKDF2 100k, SHA‑512)
- `generateKey() → base64(32 bytes)` helper for `ENCRYPTION_KEY` provisioning
- `encryptWithPassword` / `decryptWithPassword` for optional per-item salts

Salts and IVs:
- Deterministic salt (PBKDF2) only when deriving from `SECRET` so the same key is produced across restarts.
- Random per‑item salt used only by `encryptWithPassword()`; not used in default flow.
- IV is random and unique per encryption; stored with ciphertext.

More background: see `ENCRYPTION-EXPLAINED.md` and `SECURITY.md`.


## 6. API Design

Base: `/api`

- `POST /api/auth/login`
  - Body: `{ password: string }`
  - 200: `{ token: string }`
  - 401: `{ error: 'Invalid credentials' }`

- `GET /api/passwords` (JWT required)
  - Query: `?q=string&filterBy=all|site|username|tag`
  - 200: `Array<PasswordDoc>` with `password` decrypted for client use

- `POST /api/passwords` (JWT required)
  - Body: `{ id, site, username, password, tags, icon? }`
  - Side effects: `password` encrypted server-side
  - 200: `{ success: true, result }`

- `PUT /api/passwords/:id` (JWT required)
  - Updates fields; re-encrypts `password` if provided
  - 200: `{ success: true, result }`

- `DELETE /api/passwords/:id` (JWT required)
  - 200: `{ success: true, result }`

Legacy fallbacks (for old frontend compatibility):
- `GET /` returns all passwords; `POST /` creates; `DELETE /` removes by id in body.


## 7. Implementation Highlights (by file)

### Backend
- `src/app.js`
  - Sets up CORS + body parsing; mounts `/api/auth` and `/api/passwords`.
  - Implements login to issue JWT on bcrypt validation.
  - Provides legacy non‑JWT routes for compatibility.
- `src/middleware/auth.js`
  - Centralized JWT sign/verify.
  - Uses bcrypt when `AUTH_PASSWORD_HASH` is configured.
- `src/utils/crypto.js`
  - Pure Node `crypto` implementation of AES‑256‑GCM: no external libs.
  - Enforces 12‑byte IVs and 16‑byte tags; constant‑time compare helper.
  - PBKDF2 parameters: 100k iterations, SHA‑512, 32‑byte key length.
- `src/controllers/passwordController.js`
  - `normalizeSite()` ensures valid URLs (adds https:// when needed).
  - `parseTags()` normalizes tags to arrays.
  - Encrypts on create/update; decrypts on list/read.
- `src/services/passwordService.js`
  - Query composition for search: case‑insensitive regex over selected fields.
  - CRUD operations against the `passwords` collection.
- `src/config/db.js`
  - Manages MongoClient connection and exports `getDb()` for service layer.
- `server.js`
  - Loads `.env`, builds the app, and listens on `PORT`.

### Frontend
- `src/App.jsx`
  - Manages `token` in context; renders `Lock` or `Manager` accordingly.
  - Idle auto‑lock: listens to user activity and clears token after inactivity.
- `src/components/Lock.jsx`
  - Modern login screen with password toggle and motion affordances.
  - Calls `POST /api/auth/login`; saves JWT to `localStorage` on success.
- `src/components/Manager.jsx`
  - Add/update/delete entries; refresh list after mutations.
  - Search UX: filter by site/username/tag; tag chips rendering.
  - Favicon heuristics with fallback URLs; copy helpers for fields.
- `src/components/Navbar.jsx`
  - App branding and sign‑out control.
- `src/lib/apiBase.js`
  - Vite env aware base URL; defaults to relative paths so Nginx proxy works.

### Deployment/DevOps
- `Dockerfile`
  - Multi‑stage build for frontend; static served by Nginx with SPA fallback.
- `backend/Dockerfile`
  - Node 20 Alpine; `CMD ["node", "server.js"]` on port 3000.
- `nginx.conf`
  - Proxies `/api/*` to the backend; static fallback to `index.html`.
- `docker-compose.yml`
  - `mongo`, `backend`, `web`, and `mongo-express` services with sane defaults.


## 8. Approach and Rationale

- Security first: chose AES‑256‑GCM for authenticated encryption; stuck to native crypto for auditability.
- Simplicity: thin Express services with clear separation of concerns (routes → controller → service → DB).
- UX focus: instant feedback (toasts), search filters, favicon hints, and idle auto‑lock.
- Portability: Dockerized both tiers; Nginx handles SPA and reverse proxy cleanly.
- Environment discipline: prefer `ENCRYPTION_KEY` and `AUTH_PASSWORD_HASH`; added scripts to verify and test.


## 9. Results

- Functional correctness:
  - End‑to‑end CRUD works behind JWT.
  - Passwords are encrypted before storage and decrypted for session display.
- Security outcomes:
  - GCM authentication tags detect tampering during decrypt.
  - bcrypt protects the master password at rest.
  - JWT expiration prevents indefinite sessions; auto‑lock protects from walk‑aways.
- Operational:
  - Compose brings up full stack with a single file; Nginx proxy makes frontend origin‑clean.

If you run the provided backend tests and env checks:
- `backend/test-encryption.js` (script): validates encryption properties (IV uniqueness, tag verification) — expected to pass.
- `backend/verify-env.js` (script): confirms `.env` key lengths and a quick encrypt/decrypt sanity check.


## 10. Key Learnings

- Always validate key material lengths (32 bytes for AES‑256). Base64 can be misleading without length checks.
- Keep crypto simple: GCM mode provides both confidentiality and integrity; avoid home‑grown schemes.
- Deterministic vs random salt trade‑offs: deterministic salts enable stable keys from secrets, but the best practice is a random pre‑generated `ENCRYPTION_KEY`.
- Avoid leaking plaintext via logs or DB snapshots; encrypt early at the controller boundary.
- Dev/prod parity: centralize API base logic and use a reverse proxy to avoid CORS headaches.
- UX matters for security: auto‑lock on idle prevents casual compromise and feels natural in daily use.


## 11. How to Run (quick reference)

Local (dev):
```bash
# Terminal 1: backend
cd backend
npm install
cp .env.example .env   # fill AUTH_PASSWORD_HASH, AUTH_SECRET, ENCRYPTION_KEY
npm run dev

# Terminal 2: frontend
npm install
npm run dev
# Vite dev server will proxy /api to :3000 (via vite.config.js)
```

Docker (compose):
```bash
# One command stack
docker compose up --build
# Visit http://localhost:5173
```


## 12. Future Enhancements

- Key rotation migration (re‑encrypt all records with a new key).
- Rate limiting and audit logging for authentication endpoints.
- Optional client‑side (zero‑knowledge) encryption model.
- Tests: add integration tests and UI smoke checks.
- Role‑based access or multi‑user support (separate collections per user).


## 13. Environment Variables (Essentials)

Backend:
- `MONGO_URL` — defaults to `mongodb://localhost:27017` (Compose uses `mongo` service).
- `DB_NAME` — defaults to `passop`.
- `AUTH_PASSWORD_HASH` — bcrypt hash of master password (recommended).
- `AUTH_SECRET` — JWT signing key.
- `ENCRYPTION_KEY` — base64(32 bytes); preferred over SECRET‑derived keys.

Frontend:
- `VITE_API_BASE` — optional; default `/` so Nginx proxy works out‑of‑the‑box.


---

References: see `SECURITY.md` and `ENCRYPTION-EXPLAINED.md` for deep dives into algorithms, parameters, and operational best practices.
