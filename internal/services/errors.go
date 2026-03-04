package service

import (
	"errors"

	"github.com/gofiber/fiber/v3"
)

var (
	ErrNotFound   = errors.New("ไม่พบข้อมูล")
	ErrDuplicate  = errors.New("ข้อมูลซ้ำในระบบ")
	ErrValidation = errors.New("ข้อมูลไม่ถูกต้อง")
	ErrForbidden  = errors.New("ไม่มีสิทธิ์ดำเนินการ")
)

// fiber401Error สร้าง fiber.Error 401 พร้อมข้อความ
func fiber401Error(msg string) *fiber.Error {
	return fiber.NewError(fiber.StatusUnauthorized, msg)
}
