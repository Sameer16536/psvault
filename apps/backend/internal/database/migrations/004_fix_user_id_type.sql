-- Fix user_id type mismatch - Change from UUID foreign key to TEXT for Clerk integration
-- This allows storing Clerk's external auth IDs directly without requiring a users table lookup

-- Drop existing foreign key constraints
ALTER TABLE vaults DROP CONSTRAINT IF EXISTS vaults_user_id_fkey;
ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_user_id_fkey;
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

-- Change user_id columns from UUID to TEXT
ALTER TABLE vaults ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE devices ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE audit_logs ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Update users table to use TEXT for external_auth_id as primary identifier
-- Note: We're keeping the UUID id for internal references but using external_auth_id for API operations
ALTER TABLE users ADD CONSTRAINT users_external_auth_id_unique UNIQUE(external_auth_id);

-- Optional: If you want to completely remove the users table dependency and use Clerk directly,
-- you can comment out the users table and use external auth IDs everywhere
-- For now, we'll keep the users table for potential future use (storing preferences, etc.)
