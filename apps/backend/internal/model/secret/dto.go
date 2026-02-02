package secret

import (
	"time"
)

// Request to create a new secret
type CreateSecretRequest struct {
	VaultID           string            `json:"vaultId" validate:"required,uuid"`
	Type              SecretType        `json:"type" validate:"required,oneof=password note api_key card"`
	EncryptedPayload  []byte            `json:"encryptedPayload" validate:"required"`
	EncryptionVersion int               `json:"encryptionVersion" validate:"required,min=1"`
	Metadata          SecretMetadataDTO `json:"metadata" validate:"required"`
}

// Request to update a secret
type UpdateSecretRequest struct {
	EncryptedPayload  *[]byte            `json:"encryptedPayload,omitempty"`
	EncryptionVersion *int               `json:"encryptionVersion,omitempty" validate:"omitempty,min=1"`
	Metadata          *SecretMetadataDTO `json:"metadata,omitempty"`
}

// Metadata for a secret
type SecretMetadataDTO struct {
	Title  string   `json:"title" validate:"required,min=1,max=200"`
	Domain *string  `json:"domain,omitempty" validate:"omitempty,max=255"`
	Tags   []string `json:"tags,omitempty" validate:"omitempty,dive,min=1,max=50"`
}

// Response containing secret data
type SecretResponse struct {
	ID                string            `json:"id"`
	VaultID           string            `json:"vaultId"`
	Type              SecretType        `json:"type"`
	EncryptedPayload  []byte            `json:"encryptedPayload"`
	EncryptionVersion int               `json:"encryptionVersion"`
	Metadata          SecretMetadataDTO `json:"metadata"`
	LastAccessedAt    *time.Time        `json:"lastAccessedAt,omitempty"`
	CreatedAt         time.Time         `json:"createdAt"`
	UpdatedAt         time.Time         `json:"updatedAt"`
}

// Request to search secrets
type SearchSecretsRequest struct {
	VaultID *string     `query:"vaultId" validate:"omitempty,uuid"`
	Type    *SecretType `query:"type" validate:"omitempty,oneof=password note api_key card"`
	Title   *string     `query:"title" validate:"omitempty,max=200"`
	Domain  *string     `query:"domain" validate:"omitempty,max=255"`
	Tags    []string    `query:"tags" validate:"omitempty,dive,min=1,max=50"`
}
