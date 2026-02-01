package audit

import "time"

type Action string

const (
	ActionCreate Action = "create"
	ActionView   Action = "view"
	ActionUpdate Action = "update"
	ActionDelete Action = "delete"
)

type AuditLog struct {
	ID        string    `json:"id" db:"id"`
	UserID    string    `json:"userId" db:"user_id"`
	VaultID   *string   `json:"vaultId,omitempty" db:"vault_id"`
	SecretID  *string   `json:"secretId,omitempty" db:"secret_id"`
	Action    Action    `json:"action" db:"action"`
	IPAddress *string   `json:"ipAddress,omitempty" db:"ip_address"`
	UserAgent *string   `json:"userAgent,omitempty" db:"user_agent"`
	CreatedAt time.Time `json:"createdAt" db:"created_at"`
}
