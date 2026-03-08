package dto

import "time"

// --- User Management Request ---

type CreateUserRequest struct {
	Username string `json:"username" validate:"required,min=3,max=100"`
	Password string `json:"password" validate:"required,min=6"`
	Role     string `json:"role" validate:"required"` // admin, super_admin, user
}

type UpdateUserRoleRequest struct {
	Role string `json:"role" validate:"required"` // admin, super_admin, user
}

// --- User Management Response ---

type UserResponse struct {
	ID        uint      `json:"id"`
	Username  string    `json:"username"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}
