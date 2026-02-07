# PSVault API Reference

Complete API documentation for the PSVault backend.

## Base URL
```
http://localhost:8080/api
```

## Authentication
All endpoints require authentication via Clerk.

**Header:**
```
Authorization: Bearer <clerk_session_token>
```

---

## Vault Endpoints

### Create Vault
Create a new password vault.

**Endpoint:** `POST /vaults`

**Request Body:**
```json
{
  "name": "Personal Vault",
  "description": "My personal passwords"
}
```

**Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user_2abc123def",
  "name": "Personal Vault",
  "description": "My personal passwords",
  "createdAt": "2026-02-07T20:00:00Z",
  "updatedAt": "2026-02-07T20:00:00Z"
}
```

### List Vaults
Get all vaults for the authenticated user.

**Endpoint:** `GET /vaults`

**Response:** `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user_2abc123def",
    "name": "Personal Vault",
    "description": "My personal passwords",
    "createdAt": "2026-02-07T20:00:00Z",
    "updatedAt": "2026-02-07T20:00:00Z"
  }
]
```

### Get Vault
Get a specific vault by ID.

**Endpoint:** `GET /vaults/:id`

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user_2abc123def",
  "name": "Personal Vault",
  "description": "My personal passwords",
  "createdAt": "2026-02-07T20:00:00Z",
  "updatedAt": "2026-02-07T20:00:00Z"
}
```

### Update Vault
Update vault details.

**Endpoint:** `PUT /vaults/:id`

**Request Body:**
```json
{
  "name": "Updated Vault Name",
  "description": "Updated description"
}
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user_2abc123def",
  "name": "Updated Vault Name",
  "description": "Updated description",
  "createdAt": "2026-02-07T20:00:00Z",
  "updatedAt": "2026-02-07T20:30:00Z"
}
```

### Delete Vault
Delete a vault and all its secrets.

**Endpoint:** `DELETE /vaults/:id`

**Response:** `204 No Content`

---

## Secret Endpoints

### Create Secret
Create a new secret in a vault.

**Endpoint:** `POST /secrets`

**Request Body:**
```json
{
  "vaultId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "password",
  "encryptedPayload": "base64_encrypted_data_here",
  "encryptionVersion": 1,
  "metadata": {
    "title": "Gmail Account",
    "domain": "gmail.com",
    "tags": ["email", "personal"]
  }
}
```

**Secret Types:**
- `password` - Login credentials
- `note` - Secure notes
- `api_key` - API keys and tokens
- `card` - Credit card information

**Response:** `201 Created`
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "vaultId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "password",
  "encryptedPayload": "base64_encrypted_data_here",
  "encryptionVersion": 1,
  "metadata": {
    "title": "Gmail Account",
    "domain": "gmail.com",
    "tags": ["email", "personal"]
  },
  "lastAccessedAt": null,
  "createdAt": "2026-02-07T20:00:00Z",
  "updatedAt": "2026-02-07T20:00:00Z"
}
```

### Get Secret
Get a specific secret by ID. Updates `lastAccessedAt`.

**Endpoint:** `GET /secrets/:id`

**Response:** `200 OK`
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "vaultId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "password",
  "encryptedPayload": "base64_encrypted_data_here",
  "encryptionVersion": 1,
  "metadata": {
    "title": "Gmail Account",
    "domain": "gmail.com",
    "tags": ["email", "personal"]
  },
  "lastAccessedAt": "2026-02-07T20:15:00Z",
  "createdAt": "2026-02-07T20:00:00Z",
  "updatedAt": "2026-02-07T20:00:00Z"
}
```

### List Vault Secrets
Get all secrets in a specific vault.

**Endpoint:** `GET /vaults/:vaultId/secrets`

**Response:** `200 OK`
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "vaultId": "550e8400-e29b-41d4-a716-446655440000",
    "type": "password",
    "encryptedPayload": "base64_encrypted_data_here",
    "encryptionVersion": 1,
    "metadata": {
      "title": "Gmail Account",
      "domain": "gmail.com",
      "tags": ["email", "personal"]
    },
    "lastAccessedAt": "2026-02-07T20:15:00Z",
    "createdAt": "2026-02-07T20:00:00Z",
    "updatedAt": "2026-02-07T20:00:00Z"
  }
]
```

### Search Secrets
Search secrets across all vaults with filters.

**Endpoint:** `GET /secrets/search`

**Query Parameters:**
- `vaultId` (optional) - Filter by vault ID
- `type` (optional) - Filter by secret type
- `title` (optional) - Search by title (case-insensitive)
- `domain` (optional) - Search by domain (case-insensitive)
- `tags` (optional) - Filter by tags (array)

**Example:**
```
GET /secrets/search?title=gmail&type=password&tags=email
```

**Response:** `200 OK`
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "vaultId": "550e8400-e29b-41d4-a716-446655440000",
    "type": "password",
    "encryptedPayload": "base64_encrypted_data_here",
    "encryptionVersion": 1,
    "metadata": {
      "title": "Gmail Account",
      "domain": "gmail.com",
      "tags": ["email", "personal"]
    },
    "lastAccessedAt": "2026-02-07T20:15:00Z",
    "createdAt": "2026-02-07T20:00:00Z",
    "updatedAt": "2026-02-07T20:00:00Z"
  }
]
```

### Update Secret
Update secret data and/or metadata.

**Endpoint:** `PUT /secrets/:id`

**Request Body:**
```json
{
  "encryptedPayload": "new_base64_encrypted_data",
  "encryptionVersion": 2,
  "metadata": {
    "title": "Updated Gmail Account",
    "domain": "gmail.com",
    "tags": ["email", "work"]
  }
}
```

**Response:** `200 OK`
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "vaultId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "password",
  "encryptedPayload": "new_base64_encrypted_data",
  "encryptionVersion": 2,
  "metadata": {
    "title": "Updated Gmail Account",
    "domain": "gmail.com",
    "tags": ["email", "work"]
  },
  "lastAccessedAt": "2026-02-07T20:15:00Z",
  "createdAt": "2026-02-07T20:00:00Z",
  "updatedAt": "2026-02-07T20:30:00Z"
}
```

### Delete Secret
Delete a secret permanently.

**Endpoint:** `DELETE /secrets/:id`

**Response:** `204 No Content`

---

## Device Endpoints

### Register Device
Register a new device or update last seen time.

**Endpoint:** `POST /devices`

**Request Body:**
```json
{
  "deviceFingerprint": "unique_device_fingerprint_hash"
}
```

**Response:** `201 Created`
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "userId": "user_2abc123def",
  "deviceFingerprint": "unique_device_fingerprint_hash",
  "lastSeenAt": "2026-02-07T20:00:00Z",
  "createdAt": "2026-02-07T20:00:00Z",
  "updatedAt": "2026-02-07T20:00:00Z"
}
```

### List Devices
Get all registered devices for the user.

**Endpoint:** `GET /devices`

**Response:** `200 OK`
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "userId": "user_2abc123def",
    "deviceFingerprint": "unique_device_fingerprint_hash",
    "lastSeenAt": "2026-02-07T20:00:00Z",
    "createdAt": "2026-02-07T20:00:00Z",
    "updatedAt": "2026-02-07T20:00:00Z"
  }
]
```

### Delete Device
Remove a registered device.

**Endpoint:** `DELETE /devices/:id`

**Response:** `204 No Content`

---

## Error Responses

### 400 Bad Request
Invalid request format or validation error.

```json
{
  "message": "Invalid request",
  "error": "validation failed: name is required"
}
```

### 401 Unauthorized
Missing or invalid authentication token.

```json
{
  "code": "UNAUTHORIZED",
  "message": "Unauthorized",
  "status": "401"
}
```

### 403 Forbidden
User doesn't have permission to access the resource.

```json
{
  "message": "unauthorized access to vault"
}
```

### 404 Not Found
Resource not found.

```json
{
  "message": "Vault not found"
}
```

### 429 Too Many Requests
Rate limit exceeded.

```json
{
  "message": "Rate limit exceeded"
}
```

### 500 Internal Server Error
Server error occurred.

```json
{
  "message": "Failed to create vault"
}
```

---

## Rate Limiting

- **Global Rate Limit:** 20 requests per second per IP
- **Per-User Rate Limit:** Configurable via middleware

---

## Audit Logging

All actions are automatically logged to the `audit_logs` table:

**Logged Actions:**
- `create` - Resource created
- `view` - Resource accessed
- `update` - Resource modified
- `delete` - Resource deleted

**Logged Information:**
- User ID
- Vault ID (if applicable)
- Secret ID (if applicable)
- Action type
- IP address
- User agent
- Timestamp

---

## Example Usage

### Complete Workflow: Create Vault and Add Secret

```bash
# 1. Get Clerk token (from your frontend)
export CLERK_TOKEN="your_clerk_token_here"

# 2. Create a vault
VAULT_RESPONSE=$(curl -X POST http://localhost:8080/api/vaults \
  -H "Authorization: Bearer $CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Work Vault",
    "description": "Work-related passwords"
  }')

# Extract vault ID
VAULT_ID=$(echo $VAULT_RESPONSE | jq -r '.id')

# 3. Create a secret in the vault
curl -X POST http://localhost:8080/api/secrets \
  -H "Authorization: Bearer $CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"vaultId\": \"$VAULT_ID\",
    \"type\": \"password\",
    \"encryptedPayload\": \"$(echo 'my_encrypted_password' | base64)\",
    \"encryptionVersion\": 1,
    \"metadata\": {
      \"title\": \"GitHub Account\",
      \"domain\": \"github.com\",
      \"tags\": [\"development\", \"work\"]
    }
  }"

# 4. List all secrets in the vault
curl -X GET "http://localhost:8080/api/vaults/$VAULT_ID/secrets" \
  -H "Authorization: Bearer $CLERK_TOKEN"

# 5. Search for secrets
curl -X GET "http://localhost:8080/api/secrets/search?domain=github.com" \
  -H "Authorization: Bearer $CLERK_TOKEN"
```

---

## WebSocket Support (Future)

Planned for real-time notifications:
- Vault shared with you
- Secret accessed from new device
- Security alerts

---

**API Version:** 1.0  
**Last Updated:** 2026-02-07
