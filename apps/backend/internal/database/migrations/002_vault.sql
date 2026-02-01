CREATE TABLE users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    email TEXT NOT NULL,
    name TEXT ,
    external_auth_id TEXT NOT NULL,
    last_login_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    
);

CREATE TRIGGER set_UserUpdatedAt
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();



CREATE TABLE vaults(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TRIGGER set_VaultUpdatedAt
    BEFORE UPDATE ON vaults
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE vault_keys(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    vault_id UUID NOT NULL UNIQUE REFERENCES vaults(id) ON DELETE CASCADE,
    encrypted_master_key BYTEA NOT NULL,
    key_derivation_salt BYTEA NOT NULL,
    kdf_iterations INTEGER NOT NULL,
    encryption_algorithm TEXT NOT NULL
);

CREATE TRIGGER set_vault_keys_updated_at
BEFORE UPDATE ON vault_keys
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();


CREATE TYPE secret_type AS ENUM(
    'password',
    'note',
    'api_key',
    'card'
);

CREATE TABLE secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    vault_id UUID NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
    type secret_type NOT NULL,

    encrypted_payload BYTEA NOT NULL,
    encryption_version INTEGER NOT NULL,

    last_accessed_at TIMESTAMPTZ
);

CREATE TRIGGER set_secrets_updated_at
BEFORE UPDATE ON secrets
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();


CREATE TABLE secret_metadata(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    secret_id UUID NOT NULL UNIQUE REFERENCES secrets(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    domain TEXT,
    tags TEXT[]
);

CREATE TRIGGER set_secret_metadata_updated_at
BEFORE UPDATE ON secret_metadata
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();


CREATE TYPE audit_action AS ENUM (
    'create',
    'view',
    'update',
    'delete'
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id),
    vault_id UUID REFERENCES vaults(id),
    secret_id UUID REFERENCES secrets(id),

    action audit_action NOT NULL,
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_fingerprint TEXT NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER set_devices_updated_at
BEFORE UPDATE ON devices
FOR EACH ROW
EXECUTE FUNCTION trigger_set_updated_at();


