-- Migration to fix audit_logs foreign key constraint
-- Add ON DELETE CASCADE to vault_id in audit_logs table

-- Drop the existing foreign key constraint
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_vault_id_fkey;

-- Re-add the foreign key constraint with ON DELETE CASCADE
ALTER TABLE audit_logs 
ADD CONSTRAINT audit_logs_vault_id_fkey 
FOREIGN KEY (vault_id) REFERENCES vaults(id) ON DELETE CASCADE;
