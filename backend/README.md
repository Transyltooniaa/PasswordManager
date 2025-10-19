Backend (PassOP)

Run

- Development
  - Requires MongoDB running (default: mongodb://localhost:27017)
  - ENV options:
    - PORT: defaults to 3000
    - MONGO_URL: defaults to mongodb://localhost:27017
    - DB_NAME: defaults to passop
    - ENCRYPTION_KEY: base64 32-byte key for AES-256-GCM (recommended for prod)
    - SECRET: fallback string used to derive a key in dev if ENCRYPTION_KEY not set
    - AUTH_PASSWORD: simple passphrase for lock screen login (dev)
    - AUTH_PASSWORD_HASH: bcrypt hash of passphrase for login (prod recommended)

Endpoints

- New API: /api/passwords (GET, POST, PUT, DELETE)
- Backward compatibility: GET /, POST /, DELETE /

Security

- Passwords are stored encrypted with AES-256-GCM. Set ENCRYPTION_KEY in production.
- API is protected by a simple JWT login.
  - Use AUTH_PASSWORD for development (plain match).
  - For production, set AUTH_PASSWORD_HASH as a bcrypt hash and leave AUTH_PASSWORD unset.

Migration

- To encrypt any legacy plaintext passwords and add indexes, run:
  ```zsh
  npm run migrate:encrypt
  ```
  Ensure MongoDB and your env vars are set before running.
