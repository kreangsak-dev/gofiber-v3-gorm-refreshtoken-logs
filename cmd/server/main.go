package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v3"

	"nurse-table/internal/config"
	"nurse-table/internal/database"
	handler "nurse-table/internal/handlers"
	"nurse-table/internal/middleware"
	model "nurse-table/internal/models"
	repository "nurse-table/internal/repositories"
	"nurse-table/internal/routes"
	service "nurse-table/internal/services"
	"nurse-table/internal/utils/logger"
)

// structValidator — Fiber v3 StructValidator ใช้ go-playground/validator
type structValidator struct {
	validate *validator.Validate
}

func (v *structValidator) Validate(out any) error {
	return v.validate.Struct(out)
}

func main() {
	// 1. Load config
	cfg := config.LoadConfig()

	// 2. Connect DB
	db := database.Connect(cfg)

	// 3. AutoMigrate
	if err := db.AutoMigrate(&model.Product{}, &model.User{}, &model.SystemLog{}); err != nil {
		log.Fatalf("AutoMigrate fail: %v", err)
	}

	// 3.5 Init system & auth logger
	logger.InitLogger(db)

	// 4. Wire dependencies (DI)
	productRepo := repository.NewProductRepository(db)
	productSvc := service.NewProductService(productRepo)
	productH := handler.NewProductHandler(productSvc)

	userRepo := repository.NewUserRepository(db)
	authSvc := service.NewAuthService(userRepo, cfg.JWTSecret)
	authH := handler.NewAuthHandler(authSvc)

	logH := handler.NewLogHandler()

	// 5. Fiber app + StructValidator
	app := fiber.New(fiber.Config{
		AppName:         "GoFiber DI API v1.0",
		ErrorHandler:    middleware.GlobalErrorHandler,
		StructValidator: &structValidator{validate: validator.New()},
	})

	// 6. Middleware
	app.Use(middleware.Recover())
	app.Use(middleware.Logger())
	app.Use(middleware.CORS())

	// 7. Routes
	routes.SetupRoutes(app, productH, authH, logH, cfg.JWTSecret)

	// 8. Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("🚀 Server running on port %s", cfg.Port)
		if err := app.Listen(":" + cfg.Port); err != nil {
			log.Fatalf("Server startup failed: %v", err)
		}
	}()

	<-quit
	log.Println("⏳ Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := app.ShutdownWithContext(ctx); err != nil {
		log.Fatalf("Server shutdown failed: %v", err)
	}

	// ปิด DB connection pool
	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.Close()
	}

	log.Println("✅ Server stopped gracefully")
}
