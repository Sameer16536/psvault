# PSVault – Secure Password Vault Backend

PSVault is a **zero-knowledge password vault backend** built with Go, designed to securely store, encrypt, and sync user credentials across devices—without the server ever seeing plaintext passwords.

Inspired by systems like **Google Password Manager** and **Bitwarden**, PSVault follows modern security, cryptography, and clean architecture best practices.

---

## Core Principles

* 🔐 **Zero-Knowledge Architecture**
  The server never knows your master password or decrypted credentials.

* 🧠 **Client-Side Encryption**
  All sensitive data is encrypted before reaching the backend.

* 🔑 **Key Derivation, Not Storage**
  Encryption keys are derived from user secrets, never stored.

* 📦 **Encrypted-at-Rest Storage**
  The database only stores encrypted blobs and metadata.

* 🔄 **Secure Sync, Not Password Handling**
  Backend handles sync, auth, access control — not plaintext secrets.

---

## What This Backend Does (and Does NOT)

### ✅ It DOES

* Authenticate users securely
* Store encrypted credential vaults
* Version & sync vault data
* Enforce access control
* Handle metadata safely
* Support secure recovery flows

### ❌ It DOES NOT

* See user passwords
* Store master passwords
* Decrypt credentials
* Perform encryption of secrets

---

## High-Level Architecture

```
Client (Browser / App)
│
├─ Master Password (never sent)
├─ Key Derivation (Argon2)
├─ Encrypt Vault (AES-GCM)
│
▼
Backend API (PSVault)
│
├─ Auth & Sessions
├─ Encrypted Vault Storage
├─ Metadata Indexing
├─ Versioning & Sync
│
▼
PostgreSQL (Encrypted Data Only)
```

---

## Features

- **Monorepo Structure**: Organized with Turborepo for efficient builds and development
- **Go Backend**: High-performance REST API with Echo framework
- **Zero-Knowledge Authentication**: Integrated Clerk SDK for secure user management
- **Database**: PostgreSQL with migrations and connection pooling
- **Background Jobs**: Redis-based async job processing with Asynq
- **Observability**: New Relic APM integration and structured logging
- **Email Service**: Transactional emails with Resend and HTML templates
- **Testing**: Comprehensive test infrastructure with Testcontainers
- **API Documentation**: OpenAPI/Swagger specification
- **Security**: Rate limiting, CORS, secure headers, and JWT validation

---

## Monorepo Structure

```
psvault/
├── apps/
│   └── backend/          # Go backend (vault API)
├── packages/
│   └── frontend/         # Client apps (Web / Mobile)
├── turbo.json
├── package.json
└── README.md
```

---

## Backend Responsibilities

### Authentication

* Uses external identity provider (e.g., Clerk)
* Backend trusts auth provider, not passwords
* User ID is the only identity reference

### Vault Storage

Each vault entry contains:

* Encrypted secret blob
* Encrypted title/username
* Metadata (timestamps, type, version)

### Encryption Model

* Master password → Key derivation (client)
* Derived key → Encrypt credentials (client)
* Backend stores only ciphertext

### Sync & Versioning

* Each update increments vault version
* Supports multi-device sync
* Conflict resolution via timestamps

---

## Database Design (Simplified)

### users

* `id`
* `auth_provider_id`
* `created_at`

### vault_items

* `id`
* `user_id`
* `encrypted_blob`
* `item_type`
* `version`
* `updated_at`

### devices

* `id`
* `user_id`
* `last_sync_at`

---

## API Responsibilities

* `POST /vault/items` → Store encrypted vault item
* `GET /vault/items` → Fetch encrypted vault
* `PUT /vault/items/:id` → Update encrypted item
* `POST /sync` → Device sync handshake
* `POST /recovery/init` → Recovery metadata only

> ⚠️ No endpoint ever accepts plaintext passwords.

---

## Security Features

* Argon2-based key derivation (client)
* AES-256-GCM encryption (client)
* Rate limiting
* Secure headers & CORS
* Encrypted backups
* Audit logging (no secrets)

---

## Quick Start

### Prerequisites

- Go 1.24 or higher
- Node.js 22+ and Bun
- PostgreSQL 16+
- Redis 8+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Sameer16536/psvault.git
cd psvault
```

2. Install dependencies:
```bash
# Install frontend dependencies
bun install

# Install backend dependencies
cd apps/backend
go mod download
```

3. Set up environment variables:
```bash
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env with your configuration
```

4. Start the database and Redis:
```bash
docker compose up -d
```

5. Run database migrations:
```bash
cd apps/backend
task migrations:up
```

6. Start the development server:
```bash
# From root directory
bun dev

# Or just the backend
cd apps/backend
task run
```

The API will be available at `http://localhost:8080`

---

## Development

### Available Commands

```bash
# Backend commands (from backend/ directory)
task help              # Show all available tasks
task run               # Run the application
task migrations:new    # Create a new migration
task migrations:up     # Apply migrations
task test              # Run tests
task tidy              # Format code and manage dependencies

# Frontend commands (from root directory)
bun dev                # Start development servers
bun build              # Build all packages
bun lint               # Lint all packages
```

### Environment Variables

All backend variables are prefixed with `PSVAULT_`.

* `PSVAULT_DATABASE_*` - PostgreSQL connection settings
* `PSVAULT_SERVER_*` - Server configuration
* `PSVAULT_AUTH_*` - Authentication settings
* `PSVAULT_REDIS_*` - Redis connection
* `PSVAULT_EMAIL_*` - Email service configuration
* `PSVAULT_SECURITY_*` - Security configuration
* `PSVAULT_OBSERVABILITY_*` - Monitoring settings

See `apps/backend/.env.example` for a complete list.

---

## Architecture

This application follows clean architecture principles:

- **Handlers**: HTTP request/response handling
- **Services**: Business logic implementation
- **Repositories**: Data access layer
- **Models**: Domain entities
- **Infrastructure**: External services (database, cache, email)

---

## Testing

```bash
# Run backend tests
cd apps/backend
go test ./...

# Run with coverage
go test -cover ./...

# Run integration tests (requires Docker)
go test -tags=integration ./...
```

---

## Production Considerations

* Enforce HTTPS everywhere
* Use HSM or KMS for server secrets
* Enable database encryption
* Rotate auth keys regularly
* Add anomaly detection
* Perform security audits
* Use environment-specific configuration
* Configure proper database connection pooling
* Set up monitoring and alerting
* Use a reverse proxy (nginx, Caddy)
* Enable rate limiting and security headers
* Configure CORS for your domains

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
