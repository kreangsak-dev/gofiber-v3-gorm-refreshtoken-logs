package handler

import (
	"fmt"
	"nurse-table/internal/dto"
	"nurse-table/internal/logger"
	model "nurse-table/internal/models"
	repository "nurse-table/internal/repositories"
	"strconv"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v3"
	"golang.org/x/crypto/bcrypt"
)

type UserHandler struct {
	userRepo repository.UserRepository
	validate *validator.Validate
}

func NewUserHandler(userRepo repository.UserRepository, validate *validator.Validate) *UserHandler {
	return &UserHandler{
		userRepo: userRepo,
		validate: validate,
	}
}

// GetAllUsers ดึงรายชื่อผู้ใช้ทั้งหมด (สำหรับ Super Admin)
func (h *UserHandler) GetAllUsers(c fiber.Ctx) error {
	users, err := h.userRepo.GetAll(c.Context())
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "ไม่สามารถดึงข้อมูลผู้ใช้งานได้")
	}

	var response []dto.UserResponse
	for _, u := range users {
		response = append(response, dto.UserResponse{
			ID:        u.ID,
			Username:  u.Username,
			Role:      u.Role,
			CreatedAt: u.CreatedAt,
		})
	}

	return c.JSON(fiber.Map{
		"data": response,
	})
}

// CreateUser สร้างผู้ใช้ใหม่พร้อมกำหนดสิทธิ์ (สำหรับ Super Admin)
func (h *UserHandler) CreateUser(c fiber.Ctx) error {
	var req dto.CreateUserRequest
	if err := c.Bind().Body(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ข้อมูลอ้างอิงไม่ถูกต้อง")
	}

	if err := h.validate.Struct(req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	// เช็คซ้ำ
	_, err := h.userRepo.FindByUsername(c.Context(), req.Username)
	if err == nil {
		return fiber.NewError(fiber.StatusConflict, "Username นี้ถูกใช้งานแล้ว")
	}

	// Hash password
	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "เกิดข้อผิดพลาดในการเข้ารหัสรหัสผ่าน")
	}

	user := &model.User{
		Username: req.Username,
		Password: string(hashed),
		Role:     req.Role, // รับบทบาทตามที่ Super Admin ส่งมา
	}

	if err := h.userRepo.Create(c.Context(), user); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "ไม่สามารถสร้างผู้ใช้งานใหม่ได้")
	}

	logger.InfoAuth(fmt.Sprintf("Super Admin created user: %s with role: %s", user.Username, user.Role), c.IP(), "", "", &user.ID)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "สร้างผู้ใช้งานสำเร็จ",
		"data": dto.UserResponse{
			ID:        user.ID,
			Username:  user.Username,
			Role:      user.Role,
			CreatedAt: user.CreatedAt,
		},
	})
}

// UpdateUserRole แก้ไขสิทธิ์ผู้ใช้งาน (สำหรับ Super Admin)
func (h *UserHandler) UpdateUserRole(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ID ไม่ถูกต้อง")
	}
	userID := uint(id)

	var req dto.UpdateUserRoleRequest
	if err := c.Bind().Body(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "ข้อมูลอ้างอิงไม่ถูกต้อง")
	}

	if err := h.validate.Struct(req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	// ตรวจว่ามี User นี้จริงไหม
	user, err := h.userRepo.FindByID(c.Context(), userID)
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "ไม่พบผู้ใช้งานที่ระบุ")
	}

	// อัปเดต Role
	if err := h.userRepo.UpdateRole(c.Context(), userID, req.Role); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "ไม่สามารถอัปเดตสิทธิ์ได้")
	}

	logger.InfoAuth(fmt.Sprintf("Super Admin updated user %s role to %s", user.Username, req.Role), c.IP(), "", "", &userID)

	return c.JSON(fiber.Map{
		"message": "อัปเดตสิทธิ์ผู้ใช้งานสำเร็จ",
	})
}
