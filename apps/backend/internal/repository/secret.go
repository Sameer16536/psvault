package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/Sameer16536/psvault/internal/model/secret"
	"github.com/Sameer16536/psvault/internal/server"
	"github.com/jackc/pgx/v5"
)

type SecretRepository struct {
	server *server.Server
}

func NewSecretRepository(s *server.Server) *SecretRepository {
	return &SecretRepository{server: s}
}

// SecretWithMetadata - Combined secret and metadata
type SecretWithMetadata struct {
	Secret   *secret.Secret
	Metadata *secret.SecretMetadata
}

// Create - Create a new secret with metadata (transaction)
func (r *SecretRepository) Create(ctx context.Context, s *secret.Secret, m *secret.SecretMetadata) error {
	tx, err := r.server.DB.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	// Insert secret
	secretQuery := `
		INSERT INTO secrets (vault_id, type, encrypted_payload, encryption_version)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at
	`
	err = tx.QueryRow(ctx, secretQuery, s.VaultID, s.Type, s.EncryptedPayload, s.EncryptionVersion).
		Scan(&s.ID, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return err
	}
	// Insert metadata
	metadataQuery := `
		INSERT INTO secret_metadata (secret_id, title, domain, tags)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at
	`
	m.SecretID = s.ID.String()
	err = tx.QueryRow(ctx, metadataQuery, m.SecretID, m.Title, m.Domain, m.Tags).
		Scan(&m.ID, &m.CreatedAt, &m.UpdatedAt)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// GetByID - Get secret with metadata by ID
func (r *SecretRepository) GetByID(ctx context.Context, id string) (*SecretWithMetadata, error) {
	query := `
		SELECT 
			s.id, s.vault_id, s.type, s.encrypted_payload, s.encryption_version, 
			s.last_accessed_at, s.created_at, s.updated_at,
			m.id, m.title, m.domain, m.tags, m.created_at, m.updated_at
		FROM secrets s
		LEFT JOIN secret_metadata m ON s.id = m.secret_id
		WHERE s.id = $1
	`
	var s secret.Secret
	var m secret.SecretMetadata
	err := r.server.DB.Pool.QueryRow(ctx, query, id).Scan(
		&s.ID, &s.VaultID, &s.Type, &s.EncryptedPayload, &s.EncryptionVersion,
		&s.LastAccessedAt, &s.CreatedAt, &s.UpdatedAt,
		&m.ID, &m.Title, &m.Domain, &m.Tags, &m.CreatedAt, &m.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	m.SecretID = s.ID.String()
	return &SecretWithMetadata{Secret: &s, Metadata: &m}, nil
}

// ListByVaultID - List all secrets in a vault
func (r *SecretRepository) ListByVaultID(ctx context.Context, vaultID string) ([]*SecretWithMetadata, error) {
	query := `
		SELECT 
			s.id, s.vault_id, s.type, s.encrypted_payload, s.encryption_version, 
			s.last_accessed_at, s.created_at, s.updated_at,
			m.id, m.title, m.domain, m.tags, m.created_at, m.updated_at
		FROM secrets s
		LEFT JOIN secret_metadata m ON s.id = m.secret_id
		WHERE s.vault_id = $1
		ORDER BY s.created_at DESC
	`
	return r.querySecrets(ctx, query, vaultID)
}

// Search - Search secrets with filters
func (r *SecretRepository) Search(ctx context.Context, userID string, filters map[string]interface{}) ([]*SecretWithMetadata, error) {
	query := `
		SELECT 
			s.id, s.vault_id, s.type, s.encrypted_payload, s.encryption_version, 
			s.last_accessed_at, s.created_at, s.updated_at,
			m.id, m.title, m.domain, m.tags, m.created_at, m.updated_at
		FROM secrets s
		LEFT JOIN secret_metadata m ON s.id = m.secret_id
		INNER JOIN vaults v ON s.vault_id = v.id
		WHERE v.user_id = $1
	`
	args := []interface{}{userID}
	argCount := 1
	if vaultID, ok := filters["vault_id"].(string); ok && vaultID != "" {
		argCount++
		query += fmt.Sprintf(" AND s.vault_id = $%d", argCount)
		args = append(args, vaultID)
	}
	if secretType, ok := filters["type"].(string); ok && secretType != "" {
		argCount++
		query += fmt.Sprintf(" AND s.type = $%d", argCount)
		args = append(args, secretType)
	}
	if title, ok := filters["title"].(string); ok && title != "" {
		argCount++
		query += fmt.Sprintf(" AND m.title ILIKE $%d", argCount)
		args = append(args, "%"+title+"%")
	}
	if domain, ok := filters["domain"].(string); ok && domain != "" {
		argCount++
		query += fmt.Sprintf(" AND m.domain ILIKE $%d", argCount)
		args = append(args, "%"+domain+"%")
	}
	if tags, ok := filters["tags"].([]string); ok && len(tags) > 0 {
		argCount++
		query += fmt.Sprintf(" AND m.tags && $%d", argCount)
		args = append(args, tags)
	}
	query += " ORDER BY s.created_at DESC"
	return r.querySecrets(ctx, query, args...)
}

// UpdateLastAccessed - Update last accessed timestamp
func (r *SecretRepository) UpdateLastAccessed(ctx context.Context, id string) error {
	query := `UPDATE secrets SET last_accessed_at = $1 WHERE id = $2`
	_, err := r.server.DB.Pool.Exec(ctx, query, time.Now(), id)
	return err
}

// Update - Update secret and metadata
func (r *SecretRepository) Update(ctx context.Context, s *secret.Secret, m *secret.SecretMetadata) error {
	tx, err := r.server.DB.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	// Update secret
	secretQuery := `
		UPDATE secrets
		SET encrypted_payload = $1, encryption_version = $2
		WHERE id = $3
		RETURNING updated_at
	`
	err = tx.QueryRow(ctx, secretQuery, s.EncryptedPayload, s.EncryptionVersion, s.ID).
		Scan(&s.UpdatedAt)
	if err != nil {
		return err
	}
	// Update metadata
	metadataQuery := `
		UPDATE secret_metadata
		SET title = $1, domain = $2, tags = $3
		WHERE secret_id = $4
		RETURNING updated_at
	`
	err = tx.QueryRow(ctx, metadataQuery, m.Title, m.Domain, m.Tags, s.ID).
		Scan(&m.UpdatedAt)
	if err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// Delete - Delete a secret (cascade deletes metadata)
func (r *SecretRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM secrets WHERE id = $1`
	_, err := r.server.DB.Pool.Exec(ctx, query, id)
	return err
}

// Helper function to query secrets
func (r *SecretRepository) querySecrets(ctx context.Context, query string, args ...interface{}) ([]*SecretWithMetadata, error) {
	rows, err := r.server.DB.Pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var results []*SecretWithMetadata
	for rows.Next() {
		var s secret.Secret
		var m secret.SecretMetadata
		if err := rows.Scan(
			&s.ID, &s.VaultID, &s.Type, &s.EncryptedPayload, &s.EncryptionVersion,
			&s.LastAccessedAt, &s.CreatedAt, &s.UpdatedAt,
			&m.ID, &m.Title, &m.Domain, &m.Tags, &m.CreatedAt, &m.UpdatedAt,
		); err != nil {
			return nil, err
		}
		m.SecretID = s.ID.String()
		results = append(results, &SecretWithMetadata{Secret: &s, Metadata: &m})
	}
	return results, rows.Err()
}
