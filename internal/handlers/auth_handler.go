package handler

import (
	"os"

	"nurse-table/internal/dto"
	service "nurse-table/internal/services"

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

	result, err := h.svc.Register(c.Context(), &req, c.IP(), c.Get("User-Agent"))
	if err != nil {
		return err
	}

	setAuthCookies(c, result.AccessToken, result.RefreshToken)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "ลงทะเบียนสำเร็จ",
		"data": fiber.Map{
			"user_id": result.UserID,
		},
	})
}

// POST /api/auth/login
func (h *AuthHandler) Login(c fiber.Ctx) error {
	var req dto.LoginRequest
	if err := c.Bind().JSON(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ข้อมูลไม่ถูกต้อง: "+err.Error())
	}

	result, err := h.svc.Login(c.Context(), &req, c.IP(), c.Get("User-Agent"))
	if err != nil {
		return err
	}

	setAuthCookies(c, result.AccessToken, result.RefreshToken)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "เข้าสู่ระบบสำเร็จ",
		"data": fiber.Map{
			"user_id": result.UserID,
		},
	})
}

// POST /api/auth/refresh
func (h *AuthHandler) Refresh(c fiber.Ctx) error {
	refreshToken := c.Cookies("refresh_token")
	if refreshToken == "" {
		return fiber.NewError(fiber.StatusUnauthorized, "ไม่มี refresh token ในระบบ")
	}

	result, err := h.svc.Refresh(c.Context(), refreshToken)
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
	refreshToken := c.Cookies("refresh_token")
	_ = h.svc.Logout(c.Context(), refreshToken)

	clearAuthCookies(c)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "ออกจากระบบสำเร็จ",
	})
}

// --- Cookie Helpers ---

func setAuthCookies(c fiber.Ctx, accessToken, refreshToken string) {
	isProduction := os.Getenv("ENV") == "production"

	// Access Token: 15 minutes
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/",
		MaxAge:   15 * 60, // 15 mins in seconds
		Secure:   isProduction,
		HTTPOnly: true,
		SameSite: fiber.CookieSameSiteLaxMode,
	})

	// Refresh Token: 7 days
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/",
		MaxAge:   7 * 24 * 60 * 60, // 7 days in seconds
		Secure:   isProduction,
		HTTPOnly: true,
		SameSite: fiber.CookieSameSiteLaxMode,
	})
}

func clearAuthCookies(c fiber.Ctx) {
	c.ClearCookie("access_token", "refresh_token")
}
