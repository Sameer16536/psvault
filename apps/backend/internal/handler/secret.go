package handler

import (
	"net/http"

	"github.com/Sameer16536/psvault/internal/model/secret"
	"github.com/Sameer16536/psvault/internal/server"
	"github.com/Sameer16536/psvault/internal/service"
	"github.com/labstack/echo/v4"
)

type SecretHandler struct {
	server   *server.Server
	services *service.Services
}

func NewSecretHandler(s *server.Server, services *service.Services) *SecretHandler {
	return &SecretHandler{server: s, services: services}
}

// Create - POST /api/secrets
func (h *SecretHandler) Create(c echo.Context) error {
	userID := c.Get("user_id").(string)

	var req secret.CreateSecretRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request")
	}

	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	result, err := h.services.Secret.Create(c.Request().Context(), userID, &req)
	if err != nil {
		h.server.Logger.Error().Err(err).Str("user_id", userID).Msg("failed to create secret")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create secret")
	}

	return c.JSON(http.StatusCreated, result)
}

// GetByID - GET /api/secrets/:id
func (h *SecretHandler) GetByID(c echo.Context) error {
	userID := c.Get("user_id").(string)
	secretID := c.Param("id")

	result, err := h.services.Secret.GetByID(c.Request().Context(), userID, secretID)
	if err != nil {
		h.server.Logger.Error().Err(err).Str("user_id", userID).Str("secret_id", secretID).Msg("failed to get secret")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to get secret")
	}

	if result == nil {
		return echo.NewHTTPError(http.StatusNotFound, "Secret not found")
	}

	return c.JSON(http.StatusOK, result)
}

// List - GET /api/vaults/:vaultId/secrets
func (h *SecretHandler) List(c echo.Context) error {
	userID := c.Get("user_id").(string)
	vaultID := c.Param("vaultId")

	result, err := h.services.Secret.List(c.Request().Context(), userID, vaultID)
	if err != nil {
		h.server.Logger.Error().Err(err).Str("user_id", userID).Str("vault_id", vaultID).Msg("failed to list secrets")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to list secrets")
	}

	return c.JSON(http.StatusOK, result)
}

// Search - GET /api/secrets/search
func (h *SecretHandler) Search(c echo.Context) error {
	userID := c.Get("user_id").(string)

	var req secret.SearchSecretsRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request")
	}

	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	result, err := h.services.Secret.Search(c.Request().Context(), userID, &req)
	if err != nil {
		h.server.Logger.Error().Err(err).Str("user_id", userID).Msg("failed to search secrets")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to search secrets")
	}

	return c.JSON(http.StatusOK, result)
}

// Update - PUT /api/secrets/:id
func (h *SecretHandler) Update(c echo.Context) error {
	userID := c.Get("user_id").(string)
	secretID := c.Param("id")

	var req secret.UpdateSecretRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request")
	}

	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	result, err := h.services.Secret.Update(c.Request().Context(), userID, secretID, &req)
	if err != nil {
		h.server.Logger.Error().Err(err).Str("user_id", userID).Str("secret_id", secretID).Msg("failed to update secret")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to update secret")
	}

	return c.JSON(http.StatusOK, result)
}

// Delete - DELETE /api/secrets/:id
func (h *SecretHandler) Delete(c echo.Context) error {
	userID := c.Get("user_id").(string)
	secretID := c.Param("id")

	if err := h.services.Secret.Delete(c.Request().Context(), userID, secretID); err != nil {
		h.server.Logger.Error().Err(err).Str("user_id", userID).Str("secret_id", secretID).Msg("failed to delete secret")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to delete secret")
	}

	return c.NoContent(http.StatusNoContent)
}
