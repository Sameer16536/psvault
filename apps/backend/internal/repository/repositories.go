package repository

import "github.com/Sameer16536/psvault/internal/server"

type Repositories struct {
	Vault  *VaultRepository
	Secret *SecretRepository
	Device *DeviceRepository
	Audit  *AuditRepository
}

func NewRepositories(s *server.Server) *Repositories {
	return &Repositories{
		Vault:  NewVaultRepository(s),
		Secret: NewSecretRepository(s),
		Device: NewDeviceRepository(s),
		Audit:  NewAuditRepository(s),
	}
}
