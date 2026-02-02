// Services contain business logic and orchestrate repository calls.

package service

import (
	"context"
	"fmt"

	"github.com/Sameer16536/psvault/internal/model/audit"
	"github.com/Sameer16536/psvault/internal/model/vault"
	"github.com/Sameer16536/psvault/internal/repository"
	"github.com/Sameer16536/psvault/internal/server"
)

type VaultService struct {
	server *server.Server
	repos  *repository.Repositories
}

func NewVaultService(s *server.Server, repos *repository.Repositories) *VaultService {
	return &VaultService{server: s, repos: repos}
}

// Create - Create a new vault
func (s *VaultService) Create(ctx context.Context, userID string, req *vault.CreateVaultRequest) (*vault.VaultResponse, error) {
	v := &vault.Vault{
		UserID:      userID,
		Name:        *req.Name,
		Description: req.Description,
	}
	if err := s.repos.Vault.Create(ctx, v); err != nil {
		return nil, fmt.Errorf("failed to create vault: %w", err)
	}
	// Log audit
	vaultIDStr := v.ID.String()
	s.logAudit(ctx, userID, &vaultIDStr, nil, audit.ActionCreate)
	return vault.ToVaultResponse(v), nil
}

// GetByID - Get vault by ID with authorization check
func (s *VaultService) GetByID(ctx context.Context, userID, vaultID string) (*vault.VaultResponse, error) {
	v, err := s.repos.Vault.GetByID(ctx, vaultID)
	if err != nil {
		return nil, fmt.Errorf("failed to get vault: %w", err)
	}
	if v == nil {
		return nil, fmt.Errorf("vault not found")
	}
	// Authorization check
	if v.UserID != userID {
		return nil, fmt.Errorf("unauthorized access to vault")
	}
	return vault.ToVaultResponse(v), nil
}

// List - List all vaults for a user
func (s *VaultService) List(ctx context.Context, userID string) ([]*vault.VaultResponse, error) {
	vaults, err := s.repos.Vault.ListByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list vaults: %w", err)
	}
	responses := make([]*vault.VaultResponse, len(vaults))
	for i, v := range vaults {
		responses[i] = vault.ToVaultResponse(v)
	}
	return responses, nil
}

// Update - Update a vault
func (s *VaultService) Update(ctx context.Context, userID, vaultID string, req *vault.UpdateVaultRequest) (*vault.VaultResponse, error) {
	v, err := s.repos.Vault.GetByID(ctx, vaultID)
	if err != nil {
		return nil, fmt.Errorf("failed to get vault: %w", err)
	}
	if v == nil {
		return nil, fmt.Errorf("vault not found")
	}
	if v.UserID != userID {
		return nil, fmt.Errorf("unauthorized access to vault")
	}
	// Update fields if provided
	if req.Name != nil {
		v.Name = *req.Name
	}
	if req.Description != nil {
		v.Description = req.Description
	}
	if err := s.repos.Vault.Update(ctx, v); err != nil {
		return nil, fmt.Errorf("failed to update vault: %w", err)
	}
	// Log audit
	s.logAudit(ctx, userID, &vaultID, nil, audit.ActionUpdate)
	return vault.ToVaultResponse(v), nil
}

// Delete - Delete a vault
func (s *VaultService) Delete(ctx context.Context, userID, vaultID string) error {
	v, err := s.repos.Vault.GetByID(ctx, vaultID)
	if err != nil {
		return fmt.Errorf("failed to get vault: %w", err)
	}
	if v == nil {
		return fmt.Errorf("vault not found")
	}
	if v.UserID != userID {
		return fmt.Errorf("unauthorized access to vault")
	}
	if err := s.repos.Vault.Delete(ctx, vaultID); err != nil {
		return fmt.Errorf("failed to delete vault: %w", err)
	}
	// Log audit
	s.logAudit(ctx, userID, &vaultID, nil, audit.ActionDelete)
	return nil
}
func (s *VaultService) logAudit(ctx context.Context, userID string, vaultID, secretID *string, action audit.Action) {
	// Get IP and user agent from context (set by middleware)
	// For now, we'll pass nil - you can enhance this later
	log := &audit.AuditLog{
		UserID:   userID,
		VaultID:  vaultID,
		SecretID: secretID,
		Action:   action,
	}
	_ = s.repos.Audit.Log(ctx, log)
}
