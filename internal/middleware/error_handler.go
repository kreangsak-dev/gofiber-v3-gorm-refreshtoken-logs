package middleware

import (
	"errors"
	"log"
	service "nurse-table/internal/services"

	"github.com/gofiber/fiber/v3"
)

// GlobalErrorHandler — ลงทะเบียนใน fiber.Config{ErrorHandler: ...}
func GlobalErrorHandler(c fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	message := "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์"

	// 1. Sentinel errors จาก service layer (ตรวจก่อน)
	switch {
	case errors.Is(err, service.ErrNotFound):
		code = fiber.StatusNotFound
		message = err.Error()
	case errors.Is(err, service.ErrDuplicate):
		code = fiber.StatusConflict
		message = err.Error()
	case errors.Is(err, service.ErrValidation):
		code = fiber.StatusBadRequest
		message = err.Error()
	case errors.Is(err, service.ErrForbidden):
		code = fiber.StatusForbidden
		message = err.Error()
	default:
		// 2. Fiber built-in errors (404, 405, ฯลฯ)
		var fiberErr *fiber.Error
		if errors.As(err, &fiberErr) {
			code = fiberErr.Code
			message = fiberErr.Message
		}
	}

	// 3. Log unexpected errors (5xx เท่านั้น)
	if code >= 500 {
		log.Printf("[ERROR] %s %s → %v", c.Method(), c.Path(), err)
	}

	return c.Status(code).JSON(fiber.Map{
		"success": false,
		"error":   message,
	})
}
