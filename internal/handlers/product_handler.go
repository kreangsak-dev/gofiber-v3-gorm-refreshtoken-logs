package handler

import (
	"nurse-table/internal/dto"
	service "nurse-table/internal/services"
	"strconv"

	"github.com/gofiber/fiber/v3"
)

type ProductHandler struct {
	svc service.ProductService
}

func NewProductHandler(svc service.ProductService) *ProductHandler {
	return &ProductHandler{svc: svc}
}

// GET /api/products
func (h *ProductHandler) GetAll(c fiber.Ctx) error {
	result, err := h.svc.GetAll(c.Context())
	if err != nil {
		return err
	}
	return c.JSON(fiber.Map{
		"success": true,
		"data":    result,
	})
}

// GET /api/products/:id
func (h *ProductHandler) GetByID(c fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return fiber.ErrBadRequest
	}

	result, err := h.svc.GetByID(c.Context(), id)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    result,
	})
}

// POST /api/products (protected)
func (h *ProductHandler) Create(c fiber.Ctx) error {
	var req dto.CreateProductRequest
	// Fiber v3 StructValidator จะ validate อัตโนมัติตอน Bind
	if err := c.Bind().JSON(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ข้อมูลไม่ถูกต้อง: "+err.Error())
	}

	result, err := h.svc.Create(c.Context(), &req)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "สร้างสินค้าสำเร็จ",
		"data":    result,
	})
}

// PATCH /api/products/:id (protected)
func (h *ProductHandler) Update(c fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return fiber.ErrBadRequest
	}

	var req dto.UpdateProductRequest
	if err := c.Bind().JSON(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ข้อมูลไม่ถูกต้อง: "+err.Error())
	}

	result, err := h.svc.Update(c.Context(), id, &req)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    result,
	})
}

// DELETE /api/products/:id (protected)
func (h *ProductHandler) Delete(c fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return fiber.ErrBadRequest
	}

	if err := h.svc.Delete(c.Context(), id); err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "ลบสินค้าสำเร็จ",
	})
}

// --- Helper ---

func parseID(c fiber.Ctx) (uint, error) {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil || id <= 0 {
		return 0, fiber.NewError(fiber.StatusBadRequest, "ID ต้องเป็นตัวเลขจำนวนเต็มบวก")
	}
	return uint(id), nil
}
