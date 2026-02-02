package service

import (
	"context"
	"fmt"
	"time"

	"github.com/Sameer16536/psvault/internal/model/device"
	"github.com/Sameer16536/psvault/internal/repository"
	"github.com/Sameer16536/psvault/internal/server"
)

type DeviceService struct {
	server *server.Server
	repos  *repository.Repositories
}

func NewDeviceService(s *server.Server, repos *repository.Repositories) *DeviceService {
	return &DeviceService{server: s, repos: repos}
}

// Register - Register or update a device
func (s *DeviceService) Register(ctx context.Context, userID string, req *device.RegisterDeviceRequest) (*device.DeviceResponse, error) {
	d := &device.Device{
		UserID:            userID,
		DeviceFingerprint: req.DeviceFingerprint,
		LastSeenAt:        time.Now(),
	}
	if err := s.repos.Device.Register(ctx, d); err != nil {
		return nil, fmt.Errorf("failed to register device: %w", err)
	}
	return device.ToDeviceResponse(d), nil
}

// List - List all devices for a user
func (s *DeviceService) List(ctx context.Context, userID string) ([]*device.DeviceResponse, error) {
	devices, err := s.repos.Device.ListByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list devices: %w", err)
	}
	responses := make([]*device.DeviceResponse, len(devices))
	for i, d := range devices {
		responses[i] = device.ToDeviceResponse(d)
	}
	return responses, nil
}

// Delete - Delete a device
func (s *DeviceService) Delete(ctx context.Context, userID, deviceID string) error {
	// Note: You might want to add ownership verification here
	if err := s.repos.Device.Delete(ctx, deviceID); err != nil {
		return fmt.Errorf("failed to delete device: %w", err)
	}
	return nil
}
