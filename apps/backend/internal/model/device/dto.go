package device

import (
	"time"
)

// Request to register a new device
type RegisterDeviceRequest struct {
	DeviceFingerprint string `json:"deviceFingerprint" validate:"required,min=10,max=255"`
}

// Response containing device data
type DeviceResponse struct {
	ID                string    `json:"id"`
	UserID            string    `json:"userId"`
	DeviceFingerprint string    `json:"deviceFingerprint"`
	LastSeenAt        time.Time `json:"lastSeenAt"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

// Convert device model to response
func ToDeviceResponse(d *Device) *DeviceResponse {
	return &DeviceResponse{
		ID:                d.ID.String(),
		UserID:            d.UserID,
		DeviceFingerprint: d.DeviceFingerprint,
		LastSeenAt:        d.LastSeenAt,
		CreatedAt:         d.CreatedAt,
		UpdatedAt:         d.UpdatedAt,
	}
}
