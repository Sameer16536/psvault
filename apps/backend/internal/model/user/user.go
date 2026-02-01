package user

import (
	"time"

	"github.com/Sameer16536/psvault/internal/model"
)

type User struct {
	model.Base

	ExternalAuthID string     `json:"externalAuthId" db:"external_auth_id"`
	Email          string     `json:"email" db:"email"`
	Name           *string    `json:"name,omitempty" db:"name"`
	LastLoginAt    *time.Time `json:"lastLoginAt,omitempty" db:"last_login_at"`
}
