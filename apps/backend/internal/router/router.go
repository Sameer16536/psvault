package router

import (
	"net/http"

	"github.com/Sameer16536/psvault/internal/handler"
	"github.com/Sameer16536/psvault/internal/middleware"
	"github.com/Sameer16536/psvault/internal/server"
	"github.com/Sameer16536/psvault/internal/service"
	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
	"golang.org/x/time/rate"
)

func NewRouter(s *server.Server, h *handler.Handlers, services *service.Services) *echo.Echo {
	middlewares := middleware.NewMiddlewares(s)

	router := echo.New()

	router.HTTPErrorHandler = middlewares.Global.GlobalErrorHandler

	// global middlewares
	router.Use(
		echoMiddleware.RateLimiterWithConfig(echoMiddleware.RateLimiterConfig{
			Store: echoMiddleware.NewRateLimiterMemoryStore(rate.Limit(20)),
			DenyHandler: func(c echo.Context, identifier string, err error) error {
				// Record rate limit hit metrics
				if rateLimitMiddleware := middlewares.RateLimit; rateLimitMiddleware != nil {
					rateLimitMiddleware.RecordRateLimitHit(c.Path())
				}

				s.Logger.Warn().
					Str("request_id", middleware.GetRequestID(c)).
					Str("identifier", identifier).
					Str("path", c.Path()).
					Str("method", c.Request().Method).
					Str("ip", c.RealIP()).
					Msg("rate limit exceeded")

				return echo.NewHTTPError(http.StatusTooManyRequests, "Rate limit exceeded")
			},
		}),
		middlewares.Global.CORS(),
		middlewares.Global.Secure(),
		middleware.RequestID(),
		middlewares.Tracing.NewRelicMiddleware(),
		middlewares.Tracing.EnhanceTracing(),
		middlewares.ContextEnhancer.EnhanceContext(),
		middlewares.Global.RequestLogger(),
		middlewares.Global.Recover(),
	)

	// register system routes
	registerSystemRoutes(router, h)

	// register versioned routes
	router.Group("/api/v1")

	// TODO: Uncomment these routes once the handlers are created
	// api := router.Group("/api")
	//
	// // Vault routes
	// vaults := api.Group("/vaults")
	// vaults.Use(middlewares.Auth.RequireAuth)
	// vaults.POST("", h.Vault.Create)
	// vaults.GET("", h.Vault.List)
	// vaults.GET("/:id", h.Vault.GetByID)
	// vaults.PUT("/:id", h.Vault.Update)
	// vaults.DELETE("/:id", h.Vault.Delete)
	// // Vault-specific secrets
	// vaults.GET("/:vaultId/secrets", h.Secret.List)
	//
	// // Secret routes
	// secrets := api.Group("/secrets")
	// secrets.Use(middlewares.Auth.RequireAuth)
	// secrets.POST("", h.Secret.Create)
	// secrets.GET("/search", h.Secret.Search)
	// secrets.GET("/:id", h.Secret.GetByID)
	// secrets.PUT("/:id", h.Secret.Update)
	// secrets.DELETE("/:id", h.Secret.Delete)
	//
	// // Device routes
	// devices := api.Group("/devices")
	// devices.Use(middlewares.Auth.RequireAuth)
	// devices.POST("", h.Device.Register)
	// devices.GET("", h.Device.List)
	// devices.DELETE("/:id", h.Device.Delete)

	return router
}
