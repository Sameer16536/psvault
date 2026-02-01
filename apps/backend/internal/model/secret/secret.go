package secret

import (
	"time"

	"github.com/Sameer16536/psvault/internal/model"
)

type Secret struct {
	model.Base

	VaultID           string     `json:"vaultId" db:"vault_id"`
	Type              SecretType `json:"type" db:"type"`
	EncryptedPayload  []byte     `json:"-" db:"encrypted_payload"`
	EncryptionVersion int        `json:"encryptionVersion" db:"encryption_version"`
	LastAccessedAt    *time.Time `json:"lastAccessedAt,omitempty" db:"last_accessed_at"`
}
