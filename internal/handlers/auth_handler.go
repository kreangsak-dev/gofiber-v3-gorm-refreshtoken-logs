package handler

import (
	"nurse-table/internal/dto"
	service "nurse-table/internal/services"

	"time"

	"github.com/gofiber/fiber/v3"
)

type AuthHandler struct {
	svc service.AuthService
}

func NewAuthHandler(svc service.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

// POST /api/auth/register
func (h *AuthHandler) Register(c fiber.Ctx) error {
	var req dto.RegisterRequest
	if err := c.Bind().JSON(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ข้อมูลไม่ถูกต้อง: "+err.Error())
	}

	result, err := h.svc.Register(c.Context(), &req)
	if err != nil {
		return err
	}

	setAuthCookies(c, result.AccessToken, result.RefreshToken)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "ลงทะเบียนสำเร็จ",
		"data": fiber.Map{
			"user_id": result.AccessToken, // Just return some non-sensitive data if needed, or remove
		},
	})
}

// POST /api/auth/login
func (h *AuthHandler) Login(c fiber.Ctx) error {
	var req dto.LoginRequest
	if err := c.Bind().JSON(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ข้อมูลไม่ถูกต้อง: "+err.Error())
	}

	result, err := h.svc.Login(c.Context(), &req)
	if err != nil {
		return err
	}

	setAuthCookies(c, result.AccessToken, result.RefreshToken)

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"user_id": result.AccessToken,
		},
	})
}

// POST /api/auth/refresh
func (h *AuthHandler) Refresh(c fiber.Ctx) error {
	// Read refresh token from cookies instead of body
	refreshToken := c.Cookies("refresh_token")
	if refreshToken == "" {
		return fiber.NewError(fiber.StatusUnauthorized, "ไม่มี refresh token ในระบบ")
	}

	req := dto.RefreshRequest{
		RefreshToken: refreshToken,
	}

	result, err := h.svc.Refresh(c.Context(), &req)
	if err != nil {
		return err
	}

	setAuthCookies(c, result.AccessToken, result.RefreshToken)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "รีเฟรช token สำเร็จ",
	})
}

// POST /api/auth/logout
func (h *AuthHandler) Logout(c fiber.Ctx) error {
	clearAuthCookies(c)
	return c.JSON(fiber.Map{
		"success": true,
		"message": "ออกจากระบบสำเร็จ",
	})
}

// --- Cookie Helpers ---

func setAuthCookies(c fiber.Ctx, accessToken, refreshToken string) {
	// Access Token: 15 minutes
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		MaxAge:   15 * 60, // 15 mins
		Secure:   false,   // set to true in production if HTTPS
		HTTPOnly: true,
		SameSite: "Lax", // Relaxed for cross-port localhost
	})

	// Refresh Token: 7 days
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/",
		MaxAge:   7 * 24 * 60 * 60, // 7 days
		Secure:   false,            // set to true in production if HTTPS
		HTTPOnly: true,
		SameSite: "Lax",
	})
}

func clearAuthCookies(c fiber.Ctx) {
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Now().Add(-1 * time.Hour), // expire immediately
		HTTPOnly: true,
	})
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/",
		Expires:  time.Now().Add(-1 * time.Hour),
		HTTPOnly: true,
	})
}
