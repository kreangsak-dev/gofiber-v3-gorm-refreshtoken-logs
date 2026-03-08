package repository

import (
	"context"
	model "nurse-table/internal/models"

	"gorm.io/gorm"
)

type UserRepository interface {
	FindByID(ctx context.Context, id uint) (*model.User, error)
	FindByUsername(ctx context.Context, username string) (*model.User, error)
	Create(ctx context.Context, u *model.User) error
	GetAll(ctx context.Context) ([]model.User, error)
	UpdateRole(ctx context.Context, id uint, role string) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) FindByID(ctx context.Context, id uint) (*model.User, error) {
	u, err := gorm.G[model.User](r.db).Where("id = ?", id).First(ctx)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) FindByUsername(ctx context.Context, username string) (*model.User, error) {
	u, err := gorm.G[model.User](r.db).Where("username = ?", username).First(ctx)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) Create(ctx context.Context, u *model.User) error {
	return gorm.G[model.User](r.db).Create(ctx, u)
}

func (r *userRepository) GetAll(ctx context.Context) ([]model.User, error) {
	var users []model.User
	if err := r.db.WithContext(ctx).Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func (r *userRepository) UpdateRole(ctx context.Context, id uint, role string) error {
	return r.db.WithContext(ctx).Model(&model.User{}).Where("id = ?", id).Update("role", role).Error
}
