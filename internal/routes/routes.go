package routes

import (
	handler "nurse-table/internal/handlers"
	"nurse-table/internal/middleware"

	"github.com/gofiber/fiber/v3"
)

func SetupRoutes(app *fiber.App, ph *handler.ProductHandler, ah *handler.AuthHandler, lh *handler.LogHandler, uh *handler.UserHandler, dh *handler.DashboardHandler, jwtSecret string) {
	api := app.Group("/api")

	// Health check
	api.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// --- Auth routes (public) ---
	auth := api.Group("/auth")
	auth.Post("/register", ah.Register)
	auth.Post("/login", ah.Login)
	auth.Post("/refresh", ah.Refresh)
	auth.Post("/logout", ah.Logout)

	// --- Product routes ---
	products := api.Group("/products")

	// Public
	products.Get("/", ph.GetAll)
	products.Get("/:id", ph.GetByID)

	// Protected (ต้อง login)
	products.Use(middleware.JWTProtected(jwtSecret), middleware.ValidateAccessToken())
	products.Post("/", middleware.RequireRole("admin"), ph.Create)
	products.Patch("/:id", middleware.RequireRole("admin"), ph.Update)
	products.Delete("/:id", middleware.RequireRole("admin"), ph.Delete)

	// --- Log routes (protected) ---
	logs := api.Group("/logs", middleware.JWTProtected(jwtSecret), middleware.ValidateAccessToken(), middleware.RequireRole("admin"))
	logs.Get("/:type", lh.GetLogs)

	// --- User routes (Super Admin only) ---
	users := api.Group("/users", middleware.JWTProtected(jwtSecret), middleware.ValidateAccessToken(), middleware.RequireRole("super_admin"))
	users.Get("/", uh.GetAllUsers)
	users.Post("/", uh.CreateUser)
	users.Patch("/:id/role", uh.UpdateUserRole)

	// --- Dashboard routes ---
	dashboard := api.Group("/dashboard", middleware.JWTProtected(jwtSecret), middleware.ValidateAccessToken())
	dashboard.Get("/summary", dh.GetSummary)
}
