package middleware

import (
	jwtware "github.com/gofiber/contrib/v3/jwt"
	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/extractors"
	"github.com/golang-jwt/jwt/v5"
)

// JWTProtected ใช้ official JWT middleware อ่าน token จาก cookie
func JWTProtected(secret string) fiber.Handler {
	return jwtware.New(jwtware.Config{
		SigningKey: jwtware.SigningKey{Key: []byte(secret)},
		Extractor:  extractors.FromCookie("access_token"),
		ErrorHandler: func(c fiber.Ctx, err error) error {
			if err.Error() == "Missing or malformed JWT" {
				return fiber.NewError(fiber.StatusUnauthorized, "กรุณาเข้าสู่ระบบ (ไม่มี access_token)")
			}
			return fiber.NewError(fiber.StatusUnauthorized, "token ไม่ถูกต้องหรือหมดอายุ")
		},
	})
}

// ValidateAccessToken ตรวจสอบว่าเป็น access token (ไม่ใช่ refresh token)
func ValidateAccessToken() fiber.Handler {
	return func(c fiber.Ctx) error {
		token := jwtware.FromContext(c)
		if token == nil {
			return fiber.NewError(fiber.StatusUnauthorized, "กรุณาเข้าสู่ระบบ")
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return fiber.NewError(fiber.StatusUnauthorized, "token ไม่ถูกต้อง")
		}

		tokenType, ok := claims["type"].(string)
		if !ok || tokenType != "access" {
			return fiber.NewError(fiber.StatusUnauthorized, "กรุณาใช้ access token")
		}

		return c.Next()
	}
}

// RequireRole ตรวจสอบว่า User ตัวนี้มีสิทธิ์ที่อนุญาตให้เข้าถึง API นี้หรือไม่
func RequireRole(allowedRoles ...string) fiber.Handler {
	return func(c fiber.Ctx) error {
		token := jwtware.FromContext(c)
		if token == nil {
			return fiber.NewError(fiber.StatusUnauthorized, "กรุณาเข้าสู่ระบบ")
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return fiber.NewError(fiber.StatusUnauthorized, "token ไม่ถูกต้อง")
		}

		userRole, ok := claims["role"].(string)
		if !ok {
			// ถ้าไม่มีฟิลด์ role ใน JWT (อาจเป็น token เก่า) ให้ตีกลับ
			return fiber.NewError(fiber.StatusForbidden, "ไม่มีสิทธิ์เข้าถึง (ไม่พบ Role)")
		}

		// ✨ พิเศษ: super_admin เข้าได้ทุกที่โดยไม่ต้องระบุชื่อ
		if userRole == "super_admin" {
			return c.Next()
		}

		// ตรวจสอบว่า Role ของ user ตัวนี้อยู่ในรายการที่อนุญาตหรือไม่
		for _, role := range allowedRoles {
			if userRole == role {
				return c.Next() // ผ่าน
			}
		}

		// ถ้าไม่ตรงกับอะไรเลย
		return fiber.NewError(fiber.StatusForbidden, "ไม่มีสิทธิ์เข้าถึงข้อมูลส่วนนี้")
	}
}

// GetUserID ดึง user_id จาก JWT claims
func GetUserID(c fiber.Ctx) (uint, error) {
	token := jwtware.FromContext(c)
	if token == nil {
		return 0, fiber.NewError(fiber.StatusUnauthorized, "กรุณาเข้าสู่ระบบ")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, fiber.NewError(fiber.StatusUnauthorized, "token ไม่ถูกต้อง")
	}

	userID, ok := claims["user_id"].(float64)
	if !ok {
		return 0, fiber.NewError(fiber.StatusUnauthorized, "ไม่พบ user_id ใน token")
	}

	return uint(userID), nil
}

// GetUserClaims ดึง claims ทั้งหมดจาก JWT
func GetUserClaims(c fiber.Ctx) (jwt.MapClaims, error) {
	token := jwtware.FromContext(c)
	if token == nil {
		return nil, fiber.NewError(fiber.StatusUnauthorized, "กรุณาเข้าสู่ระบบ")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fiber.NewError(fiber.StatusUnauthorized, "token ไม่ถูกต้อง")
	}

	return claims, nil
}
