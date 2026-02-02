package service

import (
	"context"
	"fmt"

	"github.com/Sameer16536/psvault/internal/model/audit"
	"github.com/Sameer16536/psvault/internal/model/secret"
	"github.com/Sameer16536/psvault/internal/repository"
	"github.com/Sameer16536/psvault/internal/server"
)

type SecretService struct {
	server *server.Server
	repos  *repository.Repositories
}

func NewSecretService(s *server.Server, repos *repository.Repositories) *SecretService {
	return &SecretService{server: s, repos: repos}
}

// Create - Create a new secret with metadata
func (s *SecretService) Create(ctx context.Context, userID string, req *secret.CreateSecretRequest) (*secret.SecretResponse, error) {
	// Verify vault ownership
	vault, err := s.repos.Vault.GetByID(ctx, req.VaultID)
	if err != nil {
		return nil, fmt.Errorf("failed to get vault: %w", err)
	}
	if vault == nil {
		return nil, fmt.Errorf("vault not found")
	}
	if vault.UserID != userID {
		return nil, fmt.Errorf("unauthorized access to vault")
	}
	sec := &secret.Secret{
		VaultID:           req.VaultID,
		Type:              req.Type,
		EncryptedPayload:  req.EncryptedPayload,
		EncryptionVersion: req.EncryptionVersion,
	}
	meta := &secret.SecretMetadata{
		Title:  req.Metadata.Title,
		Domain: req.Metadata.Domain,
		Tags:   req.Metadata.Tags,
	}
	if err := s.repos.Secret.Create(ctx, sec, meta); err != nil {
		return nil, fmt.Errorf("failed to create secret: %w", err)
	}
	// Log audit
	secIDStr := sec.ID.String()
	s.logAudit(ctx, userID, &req.VaultID, &secIDStr, audit.ActionCreate)
	return s.toSecretResponse(sec, meta), nil
}

// GetByID - Get secret by ID with authorization
func (s *SecretService) GetByID(ctx context.Context, userID, secretID string) (*secret.SecretResponse, error) {
	result, err := s.repos.Secret.GetByID(ctx, secretID)
	if err != nil {
		return nil, fmt.Errorf("failed to get secret: %w", err)
	}
	if result == nil {
		return nil, fmt.Errorf("secret not found")
	}
	// Verify vault ownership
	vault, err := s.repos.Vault.GetByID(ctx, result.Secret.VaultID)
	if err != nil {
		return nil, fmt.Errorf("failed to get vault: %w", err)
	}
	if vault.UserID != userID {
		return nil, fmt.Errorf("unauthorized access to secret")
	}
	// Update last accessed
	_ = s.repos.Secret.UpdateLastAccessed(ctx, secretID)
	// Log audit
	s.logAudit(ctx, userID, &result.Secret.VaultID, &secretID, audit.ActionView)
	return s.toSecretResponse(result.Secret, result.Metadata), nil
}

// List - List secrets in a vault
func (s *SecretService) List(ctx context.Context, userID, vaultID string) ([]*secret.SecretResponse, error) {
	// Verify vault ownership
	vault, err := s.repos.Vault.GetByID(ctx, vaultID)
	if err != nil {
		return nil, fmt.Errorf("failed to get vault: %w", err)
	}
	if vault == nil {
		return nil, fmt.Errorf("vault not found")
	}
	if vault.UserID != userID {
		return nil, fmt.Errorf("unauthorized access to vault")
	}
	results, err := s.repos.Secret.ListByVaultID(ctx, vaultID)
	if err != nil {
		return nil, fmt.Errorf("failed to list secrets: %w", err)
	}
	responses := make([]*secret.SecretResponse, len(results))
	for i, r := range results {
		responses[i] = s.toSecretResponse(r.Secret, r.Metadata)
	}
	return responses, nil
}

// Search - Search secrets with filters
func (s *SecretService) Search(ctx context.Context, userID string, req *secret.SearchSecretsRequest) ([]*secret.SecretResponse, error) {
	filters := make(map[string]interface{})
	if req.VaultID != nil {
		filters["vault_id"] = *req.VaultID
	}
	if req.Type != nil {
		filters["type"] = string(*req.Type)
	}
	if req.Title != nil {
		filters["title"] = *req.Title
	}
	if req.Domain != nil {
		filters["domain"] = *req.Domain
	}
	if len(req.Tags) > 0 {
		filters["tags"] = req.Tags
	}
	results, err := s.repos.Secret.Search(ctx, userID, filters)
	if err != nil {
		return nil, fmt.Errorf("failed to search secrets: %w", err)
	}
	responses := make([]*secret.SecretResponse, len(results))
	for i, r := range results {
		responses[i] = s.toSecretResponse(r.Secret, r.Metadata)
	}
	return responses, nil
}

// Update - Update a secret
func (s *SecretService) Update(ctx context.Context, userID, secretID string, req *secret.UpdateSecretRequest) (*secret.SecretResponse, error) {
	result, err := s.repos.Secret.GetByID(ctx, secretID)
	if err != nil {
		return nil, fmt.Errorf("failed to get secret: %w", err)
	}
	if result == nil {
		return nil, fmt.Errorf("secret not found")
	}
	// Verify vault ownership
	vault, err := s.repos.Vault.GetByID(ctx, result.Secret.VaultID)
	if err != nil {
		return nil, fmt.Errorf("failed to get vault: %w", err)
	}
	if vault.UserID != userID {
		return nil, fmt.Errorf("unauthorized access to secret")
	}
	// Update fields if provided
	if req.EncryptedPayload != nil {
		result.Secret.EncryptedPayload = *req.EncryptedPayload
	}
	if req.EncryptionVersion != nil {
		result.Secret.EncryptionVersion = *req.EncryptionVersion
	}
	if req.Metadata != nil {
		result.Metadata.Title = req.Metadata.Title
		result.Metadata.Domain = req.Metadata.Domain
		result.Metadata.Tags = req.Metadata.Tags
	}
	if err := s.repos.Secret.Update(ctx, result.Secret, result.Metadata); err != nil {
		return nil, fmt.Errorf("failed to update secret: %w", err)
	}
	// Log audit
	s.logAudit(ctx, userID, &result.Secret.VaultID, &secretID, audit.ActionUpdate)
	return s.toSecretResponse(result.Secret, result.Metadata), nil
}

// Delete - Delete a secret
func (s *SecretService) Delete(ctx context.Context, userID, secretID string) error {
	result, err := s.repos.Secret.GetByID(ctx, secretID)
	if err != nil {
		return fmt.Errorf("failed to get secret: %w", err)
	}
	if result == nil {
		return fmt.Errorf("secret not found")
	}
	// Verify vault ownership
	vault, err := s.repos.Vault.GetByID(ctx, result.Secret.VaultID)
	if err != nil {
		return fmt.Errorf("failed to get vault: %w", err)
	}
	if vault.UserID != userID {
		return fmt.Errorf("unauthorized access to secret")
	}
	if err := s.repos.Secret.Delete(ctx, secretID); err != nil {
		return fmt.Errorf("failed to delete secret: %w", err)
	}
	// Log audit
	s.logAudit(ctx, userID, &result.Secret.VaultID, &secretID, audit.ActionDelete)
	return nil
}

func (s *SecretService) toSecretResponse(sec *secret.Secret, meta *secret.SecretMetadata) *secret.SecretResponse {
	return &secret.SecretResponse{
		ID:                sec.ID.String(),
		VaultID:           sec.VaultID,
		Type:              sec.Type,
		EncryptedPayload:  sec.EncryptedPayload,
		EncryptionVersion: sec.EncryptionVersion,
		Metadata: secret.SecretMetadataDTO{
			Title:  meta.Title,
			Domain: meta.Domain,
			Tags:   meta.Tags,
		},
		LastAccessedAt: sec.LastAccessedAt,
		CreatedAt:      sec.CreatedAt,
		UpdatedAt:      sec.UpdatedAt,
	}
}

func (s *SecretService) logAudit(ctx context.Context, userID string, vaultID, secretID *string, action audit.Action) {
	log := &audit.AuditLog{
		UserID:   userID,
		VaultID:  vaultID,
		SecretID: secretID,
		Action:   action,
	}
	_ = s.repos.Audit.Log(ctx, log)
}
