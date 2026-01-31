package service

import (
	"github.com/Sameer16536/psvault/internal/lib/job"
	"github.com/Sameer16536/psvault/internal/repository"
	"github.com/Sameer16536/psvault/internal/server"
)

type Services struct {
	Auth *AuthService
	Job  *job.JobService
}

func NewServices(s *server.Server, repos *repository.Repositories) (*Services, error) {
	authService := NewAuthService(s)

	return &Services{
		Job:  s.Job,
		Auth: authService,
	}, nil
}
