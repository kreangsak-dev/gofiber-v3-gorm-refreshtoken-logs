package repository

import (
	"context"
	model "nurse-table/internal/models"

	"gorm.io/gorm"
)

// Interface — ทุกคนที่อยากใช้ repository ต้องผ่าน interface นี้
type ProductRepository interface {
	FindAll(ctx context.Context) ([]model.Product, error)
	FindByID(ctx context.Context, id uint) (*model.Product, error)
	Create(ctx context.Context, p *model.Product) error
	Update(ctx context.Context, p *model.Product, updates map[string]any) error
	Delete(ctx context.Context, id uint) error
}

// Implementation — ใช้ GORM Generics API (>= v1.30.0)
type productRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) ProductRepository {
	return &productRepository{db: db}
}

func (r *productRepository) FindAll(ctx context.Context) ([]model.Product, error) {
	return gorm.G[model.Product](r.db).Find(ctx)
}

func (r *productRepository) FindByID(ctx context.Context, id uint) (*model.Product, error) {
	p, err := gorm.G[model.Product](r.db).Where("id = ?", id).First(ctx)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *productRepository) Create(ctx context.Context, p *model.Product) error {
	return gorm.G[model.Product](r.db).Create(ctx, p)
}

func (r *productRepository) Update(ctx context.Context, p *model.Product, updates map[string]any) error {
	return r.db.WithContext(ctx).Model(p).Updates(updates).Error
}

func (r *productRepository) Delete(ctx context.Context, id uint) error {
	_, err := gorm.G[model.Product](r.db).Where("id = ?", id).Delete(ctx)
	return err
}
