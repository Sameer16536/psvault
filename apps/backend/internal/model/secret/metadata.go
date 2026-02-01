package secret

import "github.com/Sameer16536/psvault/internal/model"

type SecretMetadata struct {
	model.Base

	SecretID string   `json:"secretId" db:"secret_id"`
	Title    string   `json:"title" db:"title"`
	Domain   *string  `json:"domain,omitempty" db:"domain"`
	Tags     []string `json:"tags,omitempty" db:"tags"`
}
