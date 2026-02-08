package repository

import (
	"context"

	"github.com/Sameer16536/psvault/internal/model/vault"
	"github.com/Sameer16536/psvault/internal/server"
)

type VaultRepository struct {
	server *server.Server
}

func NewVaultRepository(s *server.Server) *VaultRepository {
	return &VaultRepository{server: s}
}

// Create - Create a new vault
func (r *VaultRepository) Create(ctx context.Context, v *vault.Vault) error {
	query := `
		INSERT INTO vaults (user_id, name, description, encrypted_key, key_encryption_version)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at
	`
	return r.server.DB.Pool.QueryRow(ctx, query, v.UserID, v.Name, v.Description, v.EncryptedKey, v.KeyEncryptionVersion).
		Scan(&v.ID, &v.CreatedAt, &v.UpdatedAt)
}

// GetByID - Get vault by ID
func (r *VaultRepository) GetByID(ctx context.Context, id string) (*vault.Vault, error) {
	var v vault.Vault
	query := `
		SELECT id, user_id, name, description, encrypted_key, key_encryption_version, created_at, updated_at
		FROM vaults
		WHERE id = $1
	`
	err := r.server.DB.Pool.QueryRow(ctx, query, id).Scan(
		&v.ID, &v.UserID, &v.Name, &v.Description, &v.EncryptedKey, &v.KeyEncryptionVersion, &v.CreatedAt, &v.UpdatedAt,
	)
	if err != nil {
		// pgx returns pgx.ErrNoRows instead of sql.ErrNoRows
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, err
	}
	return &v, nil
}

// ListByUserID - List all vaults for a user
func (r *VaultRepository) ListByUserID(ctx context.Context, userID string) ([]*vault.Vault, error) {
	query := `
		SELECT id, user_id, name, description, encrypted_key, key_encryption_version, created_at, updated_at
		FROM vaults
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.server.DB.Pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var vaults []*vault.Vault
	for rows.Next() {
		var v vault.Vault
		if err := rows.Scan(&v.ID, &v.UserID, &v.Name, &v.Description, &v.EncryptedKey, &v.KeyEncryptionVersion, &v.CreatedAt, &v.UpdatedAt); err != nil {
			return nil, err
		}
		vaults = append(vaults, &v)
	}
	return vaults, rows.Err()
}

// Update - Update a vault
func (r *VaultRepository) Update(ctx context.Context, v *vault.Vault) error {
	query := `
		UPDATE vaults
		SET name = $1, description = $2
		WHERE id = $3
		RETURNING updated_at
	`
	return r.server.DB.Pool.QueryRow(ctx, query, v.Name, v.Description, v.ID).
		Scan(&v.UpdatedAt)
}

// Delete - Delete a vault
func (r *VaultRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM vaults WHERE id = $1`
	_, err := r.server.DB.Pool.Exec(ctx, query, id)
	return err
}
