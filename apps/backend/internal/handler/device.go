package handler

import (
	"net/http"

	"github.com/Sameer16536/psvault/internal/model/device"
	"github.com/Sameer16536/psvault/internal/server"
	"github.com/Sameer16536/psvault/internal/service"
	"github.com/labstack/echo/v4"
)

type DeviceHandler struct {
	server   *server.Server
	services *service.Services
}

func NewDeviceHandler(s *server.Server, services *service.Services) *DeviceHandler {
	return &DeviceHandler{server: s, services: services}
}

// Register - POST /api/devices
func (h *DeviceHandler) Register(c echo.Context) error {
	userID := c.Get("user_id").(string)

	var req device.RegisterDeviceRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request")
	}

	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	result, err := h.services.Device.Register(c.Request().Context(), userID, &req)
	if err != nil {
		h.server.Logger.Error().Err(err).Str("user_id", userID).Msg("failed to register device")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to register device")
	}

	return c.JSON(http.StatusCreated, result)
}

// List - GET /api/devices
func (h *DeviceHandler) List(c echo.Context) error {
	userID := c.Get("user_id").(string)

	result, err := h.services.Device.List(c.Request().Context(), userID)
	if err != nil {
		h.server.Logger.Error().Err(err).Str("user_id", userID).Msg("failed to list devices")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to list devices")
	}

	return c.JSON(http.StatusOK, result)
}

// Delete - DELETE /api/devices/:id
func (h *DeviceHandler) Delete(c echo.Context) error {
	userID := c.Get("user_id").(string)
	deviceID := c.Param("id")

	if err := h.services.Device.Delete(c.Request().Context(), userID, deviceID); err != nil {
		h.server.Logger.Error().Err(err).Str("user_id", userID).Str("device_id", deviceID).Msg("failed to delete device")
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to delete device")
	}

	return c.NoContent(http.StatusNoContent)
}
