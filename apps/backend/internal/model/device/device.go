package device

import (
	"time"

	"github.com/Sameer16536/psvault/internal/model"
)

type Device struct {
	model.Base

	UserID            string    `json:"userId" db:"user_id"`
	DeviceFingerprint string    `json:"deviceFingerprint" db:"device_fingerprint"`
	LastSeenAt        time.Time `json:"lastSeenAt" db:"last_seen_at"`
}
