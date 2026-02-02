package repository

import (
	"context"

	"github.com/Sameer16536/psvault/internal/model/audit"
	"github.com/Sameer16536/psvault/internal/server"
)

type AuditRepository struct {
	server *server.Server
}

func NewAuditRepository(s *server.Server) *AuditRepository {
	return &AuditRepository{server: s}
}

// Log - Create an audit log entry
func (r *AuditRepository) Log(ctx context.Context, log *audit.AuditLog) error {
	query := `
		INSERT INTO audit_logs (user_id, vault_id, secret_id, action, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`
	return r.server.DB.Pool.QueryRow(ctx, query,
		log.UserID, log.VaultID, log.SecretID, log.Action, log.IPAddress, log.UserAgent,
	).Scan(&log.ID, &log.CreatedAt)
}

// ListByUserID - List audit logs for a user
func (r *AuditRepository) ListByUserID(ctx context.Context, userID string, limit int) ([]*audit.AuditLog, error) {
	query := `
		SELECT id, user_id, vault_id, secret_id, action, ip_address, user_agent, created_at
		FROM audit_logs
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`
	rows, err := r.server.DB.Pool.Query(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var logs []*audit.AuditLog
	for rows.Next() {
		var log audit.AuditLog
		if err := rows.Scan(&log.ID, &log.UserID, &log.VaultID, &log.SecretID, &log.Action, &log.IPAddress, &log.UserAgent, &log.CreatedAt); err != nil {
			return nil, err
		}
		logs = append(logs, &log)
	}
	return logs, rows.Err()
}
