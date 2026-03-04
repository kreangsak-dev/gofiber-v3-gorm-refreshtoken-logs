package middleware

import (
	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
)

// JWTProtected สร้าง middleware ตรวจ JWT token จาก Authorization header
func JWTProtected(secret string) fiber.Handler {
	return func(c fiber.Ctx) error {
		// Read token from cookie instead of header
		tokenString := c.Cookies("access_token")
		if tokenString == "" {
			return fiber.NewError(fiber.StatusUnauthorized, "กรุณาเข้าสู่ระบบ (ไม่มี access_token ใน cookie)")
		}

		// Parse and validate token
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (any, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.NewError(fiber.StatusUnauthorized, "signing method ไม่ถูกต้อง")
			}
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			return fiber.NewError(fiber.StatusUnauthorized, "token ไม่ถูกต้องหรือหมดอายุ")
		}

		// ตรวจว่าเป็น access token (ไม่ใช่ refresh token)
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			if tokenType, _ := claims["type"].(string); tokenType != "access" {
				return fiber.NewError(fiber.StatusUnauthorized, "กรุณาใช้ access token")
			}
		}

		// เก็บ token claims ไว้ใน Locals ให้ handler ใช้ต่อ
		c.Locals("user", token)

		return c.Next()
	}
}
