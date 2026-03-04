package service

import (
	"context"
	"errors"
	"fmt"
	"nurse-table/internal/dto"
	model "nurse-table/internal/models"
	repository "nurse-table/internal/repositories"
	"time"

	"gorm.io/gorm"
)

// Interface
type ProductService interface {
	GetAll(ctx context.Context) (*dto.ProductListResponse, error)
	GetByID(ctx context.Context, id uint) (*dto.ProductResponse, error)
	Create(ctx context.Context, req *dto.CreateProductRequest) (*dto.ProductResponse, error)
	Update(ctx context.Context, id uint, req *dto.UpdateProductRequest) (*dto.ProductResponse, error)
	Delete(ctx context.Context, id uint) error
}

// Implementation
type productService struct {
	repo repository.ProductRepository
}

func NewProductService(repo repository.ProductRepository) ProductService {
	return &productService{repo: repo}
}

func (s *productService) GetAll(ctx context.Context) (*dto.ProductListResponse, error) {
	products, err := s.repo.FindAll(ctx)
	if err != nil {
		return nil, fmt.Errorf("GetAll: %w", err)
	}

	items := make([]dto.ProductResponse, len(products))
	for i, p := range products {
		items[i] = toResponse(p)
	}

	return &dto.ProductListResponse{
		Items: items,
		Total: len(items),
	}, nil
}

func (s *productService) GetByID(ctx context.Context, id uint) (*dto.ProductResponse, error) {
	p, err := s.repo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("GetByID: %w", err)
	}

	res := toResponse(*p)
	return &res, nil
}

func (s *productService) Create(ctx context.Context, req *dto.CreateProductRequest) (*dto.ProductResponse, error) {
	p := &model.Product{
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		Stock:       req.Stock,
	}

	if err := s.repo.Create(ctx, p); err != nil {
		return nil, fmt.Errorf("Create: %w", err)
	}

	res := toResponse(*p)
	return &res, nil
}

func (s *productService) Update(ctx context.Context, id uint, req *dto.UpdateProductRequest) (*dto.ProductResponse, error) {
	p, err := s.repo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("Update FindByID: %w", err)
	}

	updates := map[string]any{}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Price != nil {
		updates["price"] = *req.Price
	}
	if req.Stock != nil {
		updates["stock"] = *req.Stock
	}

	if len(updates) == 0 {
		return nil, ErrValidation
	}

	if err := s.repo.Update(ctx, p, updates); err != nil {
		return nil, fmt.Errorf("Update: %w", err)
	}

	// Re-fetch เพื่อให้ได้ข้อมูลที่อัปเดตแล้ว
	updated, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("Update re-fetch: %w", err)
	}

	res := toResponse(*updated)
	return &res, nil
}

func (s *productService) Delete(ctx context.Context, id uint) error {
	_, err := s.repo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("Delete FindByID: %w", err)
	}

	if err := s.repo.Delete(ctx, id); err != nil {
		return fmt.Errorf("Delete: %w", err)
	}
	return nil
}

// --- Helpers ---

func toResponse(p model.Product) dto.ProductResponse {
	return dto.ProductResponse{
		ID:          p.ID,
		Name:        p.Name,
		Description: p.Description,
		Price:       p.Price,
		Stock:       p.Stock,
		CreatedAt:   p.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   p.UpdatedAt.Format(time.RFC3339),
	}
}
