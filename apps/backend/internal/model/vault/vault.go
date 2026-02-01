package vault

import "github.com/Sameer16536/psvault/internal/model"

type Vault struct {
	model.Base

	UserID      string  `json:"userId" db:"user_id"`
	Name        string  `json:"name" db:"name"`
	Description *string `json:"description,omitempty" db:"description"`
}
