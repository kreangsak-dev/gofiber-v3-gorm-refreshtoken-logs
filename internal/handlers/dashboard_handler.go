package handler

import (
	"database/sql"
	"time"

	"nurse-table/internal/dto"
	model "nurse-table/internal/models"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

type DashboardHandler struct {
	db *gorm.DB
}

func NewDashboardHandler(db *gorm.DB) *DashboardHandler {
	return &DashboardHandler{db: db}
}

// GET /api/dashboard/summary
func (h *DashboardHandler) GetSummary(c fiber.Ctx) error {
	db := h.db

	// 1. Calculate General Stats (Products, Total Value, Low Stock)
	var totalProducts int64
	db.Model(&model.Product{}).Count(&totalProducts)

	var lowStockCount int64
	db.Model(&model.Product{}).Where("stock < ?", 5).Count(&lowStockCount)

	// Calculate total value (Price * Stock)
	var totalValue sql.NullFloat64
	db.Model(&model.Product{}).Select("SUM(price * stock)").Scan(&totalValue)

	res := dto.DashboardSummaryResponse{
		TotalProducts: totalProducts,
		TotalValue:    totalValue.Float64,
		LowStockCount: lowStockCount,
	}

	// 2. Determine if the user is an admin/super_admin to show hidden stats
	if userToken, ok := c.Locals("user").(*jwt.Token); ok {
		claims := userToken.Claims.(jwt.MapClaims)
		role := claims["role"].(string)

		if role == "admin" || role == "super_admin" {
			// Query Total Users
			var totalUsers int64
			db.Model(&model.User{}).Count(&totalUsers)
			res.TotalUsers = &totalUsers

			// Query 24h System Logs (Errors)
			var systemErrors int64
			yesterday := time.Now().Add(-24 * time.Hour)
			db.Model(&model.SystemLog{}).
				Where("level = ? AND created_at >= ?", "error", yesterday).
				Count(&systemErrors)

			res.SystemLogs = &systemErrors
		}
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    res,
	})
}
