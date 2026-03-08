package dto

// --- Product Request ---

type CreateProductRequest struct {
	Name        string  `json:"name"        validate:"required,min=1,max=255"`
	Description string  `json:"description"`
	Price       float64 `json:"price"       validate:"required,gte=0"`
	Stock       int     `json:"stock"       validate:"gte=0"`
}

type UpdateProductRequest struct {
	Name        *string  `json:"name"        validate:"omitempty,min=1,max=255"`
	Description *string  `json:"description"`
	Price       *float64 `json:"price"       validate:"omitempty,gte=0"`
	Stock       *int     `json:"stock"       validate:"omitempty,gte=0"`
}

// --- Product Response ---

type ProductResponse struct {
	ID          uint    `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Stock       int     `json:"stock"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

type ProductListResponse struct {
	Items []ProductResponse `json:"items"`
	Total int               `json:"total"`
}
