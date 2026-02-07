-- Add performance indexes for all tables

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_external_auth_id ON users(external_auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at);

-- Vaults table indexes
CREATE INDEX IF NOT EXISTS idx_vaults_user_id ON vaults(user_id);
CREATE INDEX IF NOT EXISTS idx_vaults_created_at ON vaults(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vaults_user_id_created_at ON vaults(user_id, created_at DESC);

-- Vault keys table indexes
CREATE INDEX IF NOT EXISTS idx_vault_keys_vault_id ON vault_keys(vault_id);

-- Secrets table indexes
CREATE INDEX IF NOT EXISTS idx_secrets_vault_id ON secrets(vault_id);
CREATE INDEX IF NOT EXISTS idx_secrets_type ON secrets(type);
CREATE INDEX IF NOT EXISTS idx_secrets_created_at ON secrets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_secrets_last_accessed_at ON secrets(last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_secrets_vault_id_type ON secrets(vault_id, type);
CREATE INDEX IF NOT EXISTS idx_secrets_vault_id_created_at ON secrets(vault_id, created_at DESC);

-- Secret metadata table indexes
CREATE INDEX IF NOT EXISTS idx_secret_metadata_secret_id ON secret_metadata(secret_id);
CREATE INDEX IF NOT EXISTS idx_secret_metadata_title ON secret_metadata(title);
CREATE INDEX IF NOT EXISTS idx_secret_metadata_domain ON secret_metadata(domain);
CREATE INDEX IF NOT EXISTS idx_secret_metadata_tags ON secret_metadata USING GIN(tags);
-- Composite index for common search patterns
CREATE INDEX IF NOT EXISTS idx_secret_metadata_title_domain ON secret_metadata(title, domain);

-- Audit logs table indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_vault_id ON audit_logs(vault_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_secret_id ON audit_logs(secret_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id_created_at ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_vault_id_created_at ON audit_logs(vault_id, created_at DESC);

-- Devices table indexes
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_device_fingerprint ON devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_devices_last_seen_at ON devices(last_seen_at DESC);
-- Unique constraint for user-device combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_user_device_unique ON devices(user_id, device_fingerprint);
