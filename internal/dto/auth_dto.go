package dto

// --- Auth Request ---

type RegisterRequest struct {
	Username string `json:"username" validate:"required,min=3,max=100"`
	Password string `json:"password" validate:"required,min=6"`
}

type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

// --- Auth Response ---

type AuthResponse struct {
	UserID       uint   `json:"user_id"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"` // raw random token (ไม่ใช่ JWT)
}
