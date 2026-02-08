-- Add encrypted vault key to vaults table
-- This key is encrypted with the user's master password
-- and is used to encrypt all secrets in the vault

ALTER TABLE vaults ADD COLUMN encrypted_key BYTEA;
ALTER TABLE vaults ADD COLUMN key_encryption_version INTEGER DEFAULT 1;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vaults_user_id ON vaults(user_id);
