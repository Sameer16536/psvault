# PSVault Backend - Complete System Documentation

> A secure, encrypted password vault backend built with Go, PostgreSQL, and Clerk authentication.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Request Flow](#request-flow)
- [Core Components](#core-components)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Authentication & Authorization](#authentication--authorization)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)

---

## 🏗️ Architecture Overview

PSVault follows a **clean architecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        HTTP Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Router     │→ │ Middleware   │→ │   Handlers   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      Business Logic Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Services   │→ │ Validation   │→ │    DTOs      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      Data Access Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Repositories │→ │   Models     │→ │  Database    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility | Code Location |
|-------|---------------|---------------|
| **HTTP** | Handle HTTP requests/responses | `internal/handler/`, `internal/router/` |
| **Business Logic** | Implement business rules, authorization | `internal/service/` |
| **Data Access** | Database operations, queries | `internal/repository/` |
| **Models** | Data structures, DTOs | `internal/model/` |

---

## 🛠️ Technology Stack

### Core Technologies
- **Language:** Go 1.21+
- **Web Framework:** Echo v4
- **Database:** PostgreSQL 15+
- **Database Driver:** pgx v5 (native PostgreSQL driver)
- **Authentication:** Clerk
- **Caching:** Redis
- **Logging:** zerolog
- **Monitoring:** New Relic

### Key Libraries
```go
// Web Framework
"github.com/labstack/echo/v4"

// Database
"github.com/jackc/pgx/v5/pgxpool"

// Authentication
"github.com/clerk/clerk-sdk-go/v2"

// Logging
"github.com/rs/zerolog"

// Validation
"github.com/go-playground/validator/v10"
```

---

## 📁 Project Structure

```
apps/backend/
├── cmd/
│   └── server/
│       └── main.go                 # Application entry point
├── internal/
│   ├── config/                     # Configuration management
│   │   └── config.go              # Config struct and loading
│   ├── database/                   # Database setup
│   │   ├── database.go            # Connection pool management
│   │   └── migrations/            # SQL migration files
│   ├── handler/                    # HTTP handlers (controllers)
│   │   ├── handlers.go            # Handler aggregator
│   │   ├── vault.go               # Vault CRUD handlers
│   │   ├── secret.go              # Secret CRUD handlers
│   │   └── device.go              # Device management handlers
│   ├── middleware/                 # HTTP middleware
│   │   ├── auth.go                # Clerk authentication
│   │   ├── cors.go                # CORS configuration
│   │   └── logger.go              # Request logging
│   ├── model/                      # Data models and DTOs
│   │   ├── base.go                # Base model with UUID, timestamps
│   │   ├── vault/                 # Vault models
│   │   ├── secret/                # Secret models
│   │   ├── device/                # Device models
│   │   └── audit/                 # Audit log models
│   ├── repository/                 # Data access layer
│   │   ├── repositories.go        # Repository aggregator
│   │   ├── vault.go               # Vault database operations
│   │   ├── secret.go              # Secret database operations
│   │   ├── device.go              # Device database operations
│   │   └── audit.go               # Audit log operations
│   ├── service/                    # Business logic layer
│   │   ├── services.go            # Service aggregator
│   │   ├── vault.go               # Vault business logic
│   │   ├── secret.go              # Secret business logic
│   │   └── device.go              # Device business logic
│   ├── router/                     # Route definitions
│   │   └── router.go              # Route setup and grouping
│   └── server/                     # Server initialization
│       └── server.go              # Server struct and setup
└── go.mod                         # Go module dependencies
```

---

## 🔄 Request Flow

### Complete Request Lifecycle

Let's trace a **"Create Vault"** request through the entire system:

#### 1. **HTTP Request Arrives**
```http
POST /api/vaults
Authorization: Bearer clerk_token_here
Content-Type: application/json

{
  "name": "Personal Vault",
  "description": "My passwords"
}
```

#### 2. **Router Matches Route**
**File:** `internal/router/router.go`
```go
// Route definition
vaults := api.Group("/vaults")
vaults.Use(middlewares.Auth.RequireAuth)  // ← Authentication middleware
vaults.POST("", h.Vault.Create)           // ← Handler mapping
```

#### 3. **Middleware Chain Executes**
**File:** `internal/middleware/auth.go`
```go
func (auth *AuthMiddleware) RequireAuth(next echo.HandlerFunc) echo.HandlerFunc {
    return echo.WrapMiddleware(
        clerkhttp.WithHeaderAuthorization(
            // Validates Clerk token
            // Extracts user_id from session claims
            // Sets user_id in context
        )
    )(func(c echo.Context) error {
        claims, ok := clerk.SessionClaimsFromContext(c.Request().Context())
        c.Set("user_id", claims.Subject)  // ← User ID stored in context
        return next(c)
    })
}
```

**Middleware execution order:**
1. Rate Limiting
2. CORS
3. Request ID generation
4. New Relic tracing
5. Context enhancement
6. Request logging
7. **Authentication** ← Validates Clerk token
8. Handler execution

#### 4. **Handler Processes Request**
**File:** `internal/handler/vault.go`
```go
func (h *VaultHandler) Create(c echo.Context) error {
    // Extract user ID from context (set by auth middleware)
    userID := c.Get("user_id").(string)  // ← From Clerk token
    
    // Parse request body
    var req vault.CreateVaultRequest
    if err := c.Bind(&req); err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, "Invalid request")
    }
    
    // Validate request
    if err := c.Validate(&req); err != nil {
        return echo.NewHTTPError(http.StatusBadRequest, err.Error())
    }
    
    // Call service layer
    result, err := h.services.Vault.Create(c.Request().Context(), userID, &req)
    if err != nil {
        h.server.Logger.Error().Err(err).Msg("failed to create vault")
        return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create vault")
    }
    
    return c.JSON(http.StatusCreated, result)
}
```

#### 5. **Service Implements Business Logic**
**File:** `internal/service/vault.go`
```go
func (s *VaultService) Create(ctx context.Context, userID string, req *vault.CreateVaultRequest) (*vault.VaultResponse, error) {
    // Create vault model
    v := &vault.Vault{
        UserID:      userID,
        Name:        *req.Name,        // Dereference pointer
        Description: req.Description,
    }
    
    // Call repository to persist
    if err := s.repos.Vault.Create(ctx, v); err != nil {
        return nil, fmt.Errorf("failed to create vault: %w", err)
    }
    
    // Log audit trail
    vaultIDStr := v.ID.String()
    s.logAudit(ctx, userID, &vaultIDStr, nil, audit.ActionCreate)
    
    // Convert to response DTO
    return vault.ToVaultResponse(v), nil
}
```

#### 6. **Repository Executes Database Query**
**File:** `internal/repository/vault.go`
```go
func (r *VaultRepository) Create(ctx context.Context, v *vault.Vault) error {
    query := `
        INSERT INTO vaults (user_id, name, description)
        VALUES ($1, $2, $3)
        RETURNING id, created_at, updated_at
    `
    // Execute query using pgx pool
    return r.server.DB.Pool.QueryRow(ctx, query, v.UserID, v.Name, v.Description).
        Scan(&v.ID, &v.CreatedAt, &v.UpdatedAt)
}
```

#### 7. **Database Executes SQL**
```sql
INSERT INTO vaults (user_id, name, description)
VALUES ('clerk_user_123', 'Personal Vault', 'My passwords')
RETURNING id, created_at, updated_at;

-- Returns:
-- id: 550e8400-e29b-41d4-a716-446655440000
-- created_at: 2026-02-07 20:00:00
-- updated_at: 2026-02-07 20:00:00
```

#### 8. **Response Travels Back Up**

**Repository → Service:**
```go
// Vault object now has ID and timestamps populated
v.ID = uuid.Parse("550e8400-e29b-41d4-a716-446655440000")
v.CreatedAt = time.Parse(...)
v.UpdatedAt = time.Parse(...)
```

**Service → Handler:**
```go
// Convert to DTO
response := &vault.VaultResponse{
    ID:          v.ID.String(),
    UserID:      v.UserID,
    Name:        v.Name,
    Description: v.Description,
    CreatedAt:   v.CreatedAt,
    UpdatedAt:   v.UpdatedAt,
}
```

**Handler → Client:**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "clerk_user_123",
  "name": "Personal Vault",
  "description": "My passwords",
  "createdAt": "2026-02-07T20:00:00Z",
  "updatedAt": "2026-02-07T20:00:00Z"
}
```

---

## 🧩 Core Components

### 1. Models & DTOs

**Base Model** - `internal/model/base.go`
```go
type Base struct {
    BaseWithId         // UUID id
    BaseWithCreatedAt  // created_at timestamp
    BaseWithUpdatedAt  // updated_at timestamp
}

type BaseWithId struct {
    ID uuid.UUID `json:"id" db:"id"`
}
```

**Vault Model** - `internal/model/vault/vault.go`
```go
type Vault struct {
    model.Base                                    // Embeds ID, timestamps
    UserID      string  `json:"userId" db:"user_id"`
    Name        string  `json:"name" db:"name"`
    Description *string `json:"description,omitempty" db:"description"`
}
```

**Request DTO** - `internal/model/vault/dto.go`
```go
type CreateVaultRequest struct {
    Name        *string `json:"name" validate:"required,min=1,max=100"`
    Description *string `json:"description,omitempty" validate:"omitempty,max=500"`
}
```

**Response DTO** - `internal/model/vault/dto.go`
```go
type VaultResponse struct {
    ID          string    `json:"id"`
    UserID      string    `json:"userId"`
    Name        string    `json:"name"`
    Description *string   `json:"description,omitempty"`
    CreatedAt   time.Time `json:"createdAt"`
    UpdatedAt   time.Time `json:"updatedAt"`
}

func ToVaultResponse(v *Vault) *VaultResponse {
    return &VaultResponse{
        ID:          v.ID.String(),  // Convert UUID to string
        UserID:      v.UserID,
        Name:        v.Name,
        Description: v.Description,
        CreatedAt:   v.CreatedAt,
        UpdatedAt:   v.UpdatedAt,
    }
}
```

### 2. Repository Pattern

**Repository Interface Pattern:**
```go
type VaultRepository struct {
    server *server.Server  // Access to DB pool, logger, config
}

// CRUD operations
func (r *VaultRepository) Create(ctx context.Context, v *vault.Vault) error
func (r *VaultRepository) GetByID(ctx context.Context, id string) (*vault.Vault, error)
func (r *VaultRepository) ListByUserID(ctx context.Context, userID string) ([]*vault.Vault, error)
func (r *VaultRepository) Update(ctx context.Context, v *vault.Vault) error
func (r *VaultRepository) Delete(ctx context.Context, id string) error
```

**Database Operations:**
```go
// Using pgx v5 connection pool
r.server.DB.Pool.QueryRow(ctx, query, args...).Scan(&result)
r.server.DB.Pool.Query(ctx, query, args...)
r.server.DB.Pool.Exec(ctx, query, args...)

// Transactions
tx, _ := r.server.DB.Pool.Begin(ctx)
defer tx.Rollback(ctx)
// ... operations
tx.Commit(ctx)
```

### 3. Service Layer

**Service Responsibilities:**
- Business logic validation
- Authorization checks
- Orchestrating multiple repository calls
- Audit logging
- Error handling

**Example - Authorization Check:**
```go
func (s *VaultService) GetByID(ctx context.Context, userID, vaultID string) (*vault.VaultResponse, error) {
    v, err := s.repos.Vault.GetByID(ctx, vaultID)
    if err != nil {
        return nil, fmt.Errorf("failed to get vault: %w", err)
    }
    
    // Authorization: Verify vault belongs to user
    if v.UserID != userID {
        return nil, fmt.Errorf("unauthorized access to vault")
    }
    
    return vault.ToVaultResponse(v), nil
}
```

### 4. Handler Layer

**Handler Responsibilities:**
- HTTP request/response handling
- Request parsing and validation
- Calling service methods
- Error response formatting

**Error Handling Pattern:**
```go
// Bad request (400)
if err := c.Bind(&req); err != nil {
    return echo.NewHTTPError(http.StatusBadRequest, "Invalid request")
}

// Validation error (400)
if err := c.Validate(&req); err != nil {
    return echo.NewHTTPError(http.StatusBadRequest, err.Error())
}

// Not found (404)
if result == nil {
    return echo.NewHTTPError(http.StatusNotFound, "Vault not found")
}

// Server error (500)
if err != nil {
    h.server.Logger.Error().Err(err).Msg("operation failed")
    return echo.NewHTTPError(http.StatusInternalServerError, "Operation failed")
}
```

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌─────────────┐
│    users    │
│─────────────│
│ id (PK)     │
│ email       │
│ external_   │
│  auth_id    │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────────┐         ┌──────────────┐
│     vaults      │ 1:1     │ vault_keys   │
│─────────────────│◄────────┤──────────────│
│ id (PK)         │         │ id (PK)      │
│ user_id (FK)    │         │ vault_id(FK) │
│ name            │         │ encrypted_   │
│ description     │         │  master_key  │
└────────┬────────┘         └──────────────┘
         │
         │ 1:N
         │
┌────────▼────────┐         ┌──────────────────┐
│    secrets      │ 1:1     │ secret_metadata  │
│─────────────────│◄────────┤──────────────────│
│ id (PK)         │         │ id (PK)          │
│ vault_id (FK)   │         │ secret_id (FK)   │
│ type            │         │ title            │
│ encrypted_      │         │ domain           │
│  payload        │         │ tags[]           │
│ last_accessed   │         └──────────────────┘
└─────────────────┘

┌─────────────┐         ┌──────────────┐
│   devices   │         │ audit_logs   │
│─────────────│         │──────────────│
│ id (PK)     │         │ id (PK)      │
│ user_id     │         │ user_id      │
│ fingerprint │         │ vault_id     │
│ last_seen   │         │ secret_id    │
└─────────────┘         │ action       │
                        │ ip_address   │
                        └──────────────┘
```

### Key Tables

**vaults** - User password vaults
```sql
CREATE TABLE vaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,              -- Clerk user ID
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**secrets** - Encrypted passwords/notes
```sql
CREATE TABLE secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    type secret_type NOT NULL,          -- ENUM: password, note, api_key, card
    encrypted_payload BYTEA NOT NULL,   -- Encrypted data
    encryption_version INTEGER NOT NULL,
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**secret_metadata** - Searchable metadata
```sql
CREATE TABLE secret_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secret_id UUID NOT NULL UNIQUE REFERENCES secrets(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    domain TEXT,
    tags TEXT[],                        -- Array of tags
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Performance Indexes (29 total)

**Critical indexes for query performance:**
```sql
-- User lookups
CREATE INDEX idx_vaults_user_id ON vaults(user_id);
CREATE INDEX idx_devices_user_id ON devices(user_id);

-- Vault secret listing
CREATE INDEX idx_secrets_vault_id_created_at ON secrets(vault_id, created_at DESC);

-- Tag searches (GIN index for array containment)
CREATE INDEX idx_secret_metadata_tags ON secret_metadata USING GIN(tags);

-- Audit trail queries
CREATE INDEX idx_audit_logs_user_id_created_at ON audit_logs(user_id, created_at DESC);
```

---

## 🔌 API Endpoints

### Authentication Required
All endpoints require `Authorization: Bearer <clerk_token>` header.

### Vault Endpoints

| Method | Endpoint | Handler | Description |
|--------|----------|---------|-------------|
| POST | `/api/vaults` | `VaultHandler.Create` | Create new vault |
| GET | `/api/vaults` | `VaultHandler.List` | List user's vaults |
| GET | `/api/vaults/:id` | `VaultHandler.GetByID` | Get vault details |
| PUT | `/api/vaults/:id` | `VaultHandler.Update` | Update vault |
| DELETE | `/api/vaults/:id` | `VaultHandler.Delete` | Delete vault |
| GET | `/api/vaults/:vaultId/secrets` | `SecretHandler.List` | List vault secrets |

### Secret Endpoints

| Method | Endpoint | Handler | Description |
|--------|----------|---------|-------------|
| POST | `/api/secrets` | `SecretHandler.Create` | Create new secret |
| GET | `/api/secrets/search` | `SecretHandler.Search` | Search secrets |
| GET | `/api/secrets/:id` | `SecretHandler.GetByID` | Get secret details |
| PUT | `/api/secrets/:id` | `SecretHandler.Update` | Update secret |
| DELETE | `/api/secrets/:id` | `SecretHandler.Delete` | Delete secret |

### Device Endpoints

| Method | Endpoint | Handler | Description |
|--------|----------|---------|-------------|
| POST | `/api/devices` | `DeviceHandler.Register` | Register device |
| GET | `/api/devices` | `DeviceHandler.List` | List user devices |
| DELETE | `/api/devices/:id` | `DeviceHandler.Delete` | Remove device |

---

## 🔐 Authentication & Authorization

### Clerk Integration

**Authentication Flow:**
```
1. Client obtains Clerk session token
2. Client sends request with Authorization header
3. Auth middleware validates token with Clerk
4. User ID extracted from session claims
5. User ID stored in request context
6. Handlers access user ID for authorization
```

**Middleware Implementation:**
```go
// internal/middleware/auth.go
func (auth *AuthMiddleware) RequireAuth(next echo.HandlerFunc) echo.HandlerFunc {
    return echo.WrapMiddleware(
        clerkhttp.WithHeaderAuthorization(...)
    )(func(c echo.Context) error {
        claims, ok := clerk.SessionClaimsFromContext(c.Request().Context())
        if !ok {
            return errs.NewUnauthorizedError("Unauthorized", false)
        }
        
        // Store user info in context
        c.Set("user_id", claims.Subject)
        c.Set("user_role", claims.ActiveOrganizationRole)
        c.Set("permissions", claims.Claims.ActiveOrganizationPermissions)
        
        return next(c)
    })
}
```

**Authorization in Services:**
```go
// Verify resource ownership
func (s *VaultService) GetByID(ctx context.Context, userID, vaultID string) (*vault.VaultResponse, error) {
    v, err := s.repos.Vault.GetByID(ctx, vaultID)
    
    // Authorization check
    if v.UserID != userID {
        return nil, fmt.Errorf("unauthorized access to vault")
    }
    
    return vault.ToVaultResponse(v), nil
}
```

---

## 🚀 Getting Started

### Prerequisites
- Go 1.21+
- PostgreSQL 15+
- Redis (optional, for caching)
- Clerk account

### Environment Setup

Create `.env` file:
```env
# Server
PORT=8080
ENV=local

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=admin
DB_NAME=psvault
DB_SSL_MODE=disable

# Clerk
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

# Redis
REDIS_ADDRESS=localhost:6379

# New Relic (optional)
NEW_RELIC_LICENSE_KEY=...
NEW_RELIC_APP_NAME=psvault-backend
```

### Installation

```bash
# Clone repository
git clone <repository-url>
cd apps/backend

# Install dependencies
go mod download

# Run migrations
psql "postgres://postgres:admin@localhost:5432/psvault?sslmode=disable" \
  -f internal/database/migrations/001_setup.sql
psql "postgres://postgres:admin@localhost:5432/psvault?sslmode=disable" \
  -f internal/database/migrations/002_vault.sql
psql "postgres://postgres:admin@localhost:5432/psvault?sslmode=disable" \
  -f internal/database/migrations/004_fix_user_id_type.sql
psql "postgres://postgres:admin@localhost:5432/psvault?sslmode=disable" \
  -f internal/database/migrations/003_indexes.sql

# Run server
go run cmd/server/main.go
```

### Testing API

```bash
# Get Clerk token (from your frontend or Clerk dashboard)
export CLERK_TOKEN="your_clerk_token_here"

# Create a vault
curl -X POST http://localhost:8080/api/vaults \
  -H "Authorization: Bearer $CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Personal Vault",
    "description": "My passwords"
  }'

# List vaults
curl -X GET http://localhost:8080/api/vaults \
  -H "Authorization: Bearer $CLERK_TOKEN"
```

---

## 🔧 Development Workflow

### Adding a New Feature

**Example: Adding a "Share Vault" feature**

#### 1. Create Model
```go
// internal/model/vault/share.go
type VaultShare struct {
    model.Base
    VaultID      uuid.UUID `json:"vaultId" db:"vault_id"`
    SharedWithID string    `json:"sharedWithId" db:"shared_with_id"`
    Permission   string    `json:"permission" db:"permission"`
}
```

#### 2. Create Repository Method
```go
// internal/repository/vault.go
func (r *VaultRepository) ShareVault(ctx context.Context, share *vault.VaultShare) error {
    query := `INSERT INTO vault_shares (vault_id, shared_with_id, permission) VALUES ($1, $2, $3)`
    _, err := r.server.DB.Pool.Exec(ctx, query, share.VaultID, share.SharedWithID, share.Permission)
    return err
}
```

#### 3. Create Service Method
```go
// internal/service/vault.go
func (s *VaultService) ShareVault(ctx context.Context, userID, vaultID, shareWithID, permission string) error {
    // Verify ownership
    v, err := s.repos.Vault.GetByID(ctx, vaultID)
    if v.UserID != userID {
        return fmt.Errorf("unauthorized")
    }
    
    // Create share
    share := &vault.VaultShare{
        VaultID:      uuid.MustParse(vaultID),
        SharedWithID: shareWithID,
        Permission:   permission,
    }
    
    return s.repos.Vault.ShareVault(ctx, share)
}
```

#### 4. Create Handler
```go
// internal/handler/vault.go
func (h *VaultHandler) Share(c echo.Context) error {
    userID := c.Get("user_id").(string)
    vaultID := c.Param("id")
    
    var req ShareVaultRequest
    c.Bind(&req)
    
    err := h.services.Vault.ShareVault(ctx, userID, vaultID, req.ShareWithID, req.Permission)
    if err != nil {
        return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
    }
    
    return c.NoContent(http.StatusOK)
}
```

#### 5. Add Route
```go
// internal/router/router.go
vaults.POST("/:id/share", h.Vault.Share)
```

---

## 📊 Monitoring & Logging

### Structured Logging
```go
// Using zerolog
h.server.Logger.Info().
    Str("user_id", userID).
    Str("vault_id", vaultID).
    Msg("vault created successfully")

h.server.Logger.Error().
    Err(err).
    Str("user_id", userID).
    Msg("failed to create vault")
```

### New Relic Integration
- Automatic transaction tracing
- Database query monitoring
- Error tracking
- Custom metrics

---

## 🎯 Best Practices

### 1. Error Handling
```go
// Always wrap errors with context
return fmt.Errorf("failed to create vault: %w", err)

// Log errors before returning
h.server.Logger.Error().Err(err).Msg("operation failed")
```

### 2. Context Usage
```go
// Always pass context for cancellation
func (r *Repository) Method(ctx context.Context, ...) error

// Use context for database operations
r.server.DB.Pool.QueryRow(ctx, query, args...)
```

### 3. Transaction Management
```go
tx, err := r.server.DB.Pool.Begin(ctx)
if err != nil {
    return err
}
defer tx.Rollback(ctx)  // Always defer rollback

// ... operations

return tx.Commit(ctx)
```

### 4. Authorization
```go
// Always verify ownership in service layer
if resource.UserID != userID {
    return fmt.Errorf("unauthorized access")
}
```

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Follow code style and patterns
4. Add tests
5. Submit pull request

---

**Built with ❤️ using Go, PostgreSQL, and Clerk**