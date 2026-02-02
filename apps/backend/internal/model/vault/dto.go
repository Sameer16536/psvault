// DTOs define the structure of API requests and responses with validation.

package vault

import (
	"time"
)

// Request to create a new vault
type CreateVaultRequest struct {
	Name        *string `json:"name" validate:"required,min=1,max=100"`
	Description *string `json:"description,omitempty" validate:"omitempty,max=500"`
}

// Request to Update vault
type UpdateVaultRequest struct {
	Name        *string `json:"name,omitempty" validate:"omitempty,min=1,max=100"`
	Description *string `json:"description,omitempty" validate:"omitempty,max=500"`
}

// Response containing vault data
type VaultResponse struct {
	ID          string    `json:"id"`
	UserID      string    `json:"userId"`
	Name        string    `json:"name"`
	Description *string   `json:"description,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// Convert vault model to response
func ToVaultResponse(v *Vault) *VaultResponse {
	return &VaultResponse{
		ID:          v.ID.String(),
		UserID:      v.UserID,
		Name:        v.Name,
		Description: v.Description,
		CreatedAt:   v.CreatedAt,
		UpdatedAt:   v.UpdatedAt,
	}
}
