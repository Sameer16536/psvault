package handler

import (
	"github.com/Sameer16536/psvault/internal/server"
	"github.com/Sameer16536/psvault/internal/service"
)

type Handlers struct {
	Health  *HealthHandler
	OpenAPI *OpenAPIHandler
	Vault   *VaultHandler
	Secret  *SecretHandler
	Device  *DeviceHandler
}

func NewHandlers(s *server.Server, services *service.Services) *Handlers {
	return &Handlers{
		Health:  NewHealthHandler(s),
		OpenAPI: NewOpenAPIHandler(s),
		Vault:   NewVaultHandler(s, services),
		Secret:  NewSecretHandler(s, services),
		Device:  NewDeviceHandler(s, services),
	}
}
