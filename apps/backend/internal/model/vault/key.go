package vault

import "github.com/Sameer16536/psvault/internal/model"

type VaultKey struct {
	model.Base

	VaultID             string `json:"vaultId" db:"vault_id"`
	EncryptedMasterKey  []byte `json:"-" db:"encrypted_master_key"`
	KeyDerivationSalt   []byte `json:"-" db:"key_derivation_salt"`
	KDFIterations       int    `json:"-" db:"kdf_iterations"`
	EncryptionAlgorithm string `json:"encryptionAlgorithm" db:"encryption_algorithm"`
}
