package utils

import "github.com/gofiber/fiber/v3"

type Response struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Data    any    `json:"data,omitempty"`
	Error   string `json:"error,omitempty"`
}

func SuccessResponse(c fiber.Ctx, data any) error {
	return c.JSON(Response{
		Success: true,
		Data:    data,
	})
}

func SuccessMessageResponse(c fiber.Ctx, message string, data any) error {
	return c.JSON(Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func ErrorResponse(c fiber.Ctx, status int, message string) error {
	return c.Status(status).JSON(Response{
		Success: false,
		Error:   message,
	})
}

//
//
// เป็น standard format ที่ใช้ทั่วทั้ง application ไม่ใช่ business data
