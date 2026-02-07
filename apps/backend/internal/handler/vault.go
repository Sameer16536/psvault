package handler

import (
	"net/http"

	"github.com/Sameer16536/psvault/internal/model/vault"
	"github.com/Sameer16536/psvault/internal/server"
	"github.com/Sameer16536/psvault/internal/service"
	"github.com/labstack/echo/v4"
)

type VaultHandler struct {
	server   *server.Server
	services *service.Services
}

func NewVaultHandler(s *server.Server, services *service.Services) *VaultHandler {
	return &VaultHandler{server: s, services: services}
}

// Create - POST /api/vaults
func (h *VaultHandler) Create(c echo.Context) error {
	userID := c.Get("user_id").(string)

	var req vault.CreateVaultRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request")
	}

	// Validate request
	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	result, err := h.services.Vault.Create(c.Request().Context(), userID, &req)
	if err != nil {
		h.server.Logger.Error().Err(err).Str("user_id", userID).Msg("failed to create vault")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create vault")
	}

	return c.JSON(http.StatusCreated, result)
}

// List - GET /api/vaults
func (h *VaultHandler) List(c echo.Context) error {
	userID := c.Get("user_id").(string)

	result, err := h.services.Vault.List(c.Request().Context(), userID)
	if err != nil {
		h.server.Logger.Error().Err(err).Str("user_id", userID).Msg("failed to list vaults")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to list vaults")
	}

	return c.JSON(http.StatusOK, result)
}

// GetByID - GET /api/vaults/:id
func (h *VaultHandler) GetByID(c echo.Context) error {
	userID := c.Get("user_id").(string)
	vaultID := c.Param("id")

	result, err := h.services.Vault.GetByID(c.Request().Context(), userID, vaultID)
	if err != nil {
		h.server.Logger.Error().Err(err).Str("user_id", userID).Str("vault_id", vaultID).Msg("failed to get vault")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to get vault")
	}

	if result == nil {
		return echo.NewHTTPError(http.StatusNotFound, "Vault not found")
	}

	return c.JSON(http.StatusOK, result)
}

// Update - PUT /api/vaults/:id
func (h *VaultHandler) Update(c echo.Context) error {
	userID := c.Get("user_id").(string)
	vaultID := c.Param("id")

	var req vault.UpdateVaultRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request")
	}

	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	result, err := h.services.Vault.Update(c.Request().Context(), userID, vaultID, &req)
	if err != nil {
		h.server.Logger.Error().Err(err).Str("user_id", userID).Str("vault_id", vaultID).Msg("failed to update vault")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to update vault")
	}

	return c.JSON(http.StatusOK, result)
}

// Delete - DELETE /api/vaults/:id
func (h *VaultHandler) Delete(c echo.Context) error {
	userID := c.Get("user_id").(string)
	vaultID := c.Param("id")

	if err := h.services.Vault.Delete(c.Request().Context(), userID, vaultID); err != nil {
		h.server.Logger.Error().Err(err).Str("user_id", userID).Str("vault_id", vaultID).Msg("failed to delete vault")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to delete vault")
	}

	return c.NoContent(http.StatusNoContent)
}
