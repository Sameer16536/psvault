package repository

import (
	"context"
	"time"

	"github.com/Sameer16536/psvault/internal/model/device"
	"github.com/Sameer16536/psvault/internal/server"
)

type DeviceRepository struct {
	server *server.Server
}

func NewDeviceRepository(s *server.Server) *DeviceRepository {
	return &DeviceRepository{server: s}
}

// Register - Register a new device or update if exists
func (r *DeviceRepository) Register(ctx context.Context, d *device.Device) error {
	query := `
		INSERT INTO devices (user_id, device_fingerprint, last_seen_at)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, device_fingerprint) 
		DO UPDATE SET last_seen_at = EXCLUDED.last_seen_at
		RETURNING id, created_at, updated_at
	`
	return r.server.DB.Pool.QueryRow(ctx, query, d.UserID, d.DeviceFingerprint, d.LastSeenAt).
		Scan(&d.ID, &d.CreatedAt, &d.UpdatedAt)
}

// ListByUserID - List all devices for a user
func (r *DeviceRepository) ListByUserID(ctx context.Context, userID string) ([]*device.Device, error) {
	query := `
		SELECT id, user_id, device_fingerprint, last_seen_at, created_at, updated_at
		FROM devices
		WHERE user_id = $1
		ORDER BY last_seen_at DESC
	`
	rows, err := r.server.DB.Pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var devices []*device.Device
	for rows.Next() {
		var d device.Device
		if err := rows.Scan(&d.ID, &d.UserID, &d.DeviceFingerprint, &d.LastSeenAt, &d.CreatedAt, &d.UpdatedAt); err != nil {
			return nil, err
		}
		devices = append(devices, &d)
	}
	return devices, rows.Err()
}

// UpdateLastSeen - Update device last seen timestamp
func (r *DeviceRepository) UpdateLastSeen(ctx context.Context, id string) error {
	query := `UPDATE devices SET last_seen_at = $1 WHERE id = $2`
	_, err := r.server.DB.Pool.Exec(ctx, query, time.Now(), id)
	return err
}

// Delete - Delete a device
func (r *DeviceRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM devices WHERE id = $1`
	_, err := r.server.DB.Pool.Exec(ctx, query, id)
	return err
}
