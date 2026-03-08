package repository

import (
	"context"
	model "nurse-table/internal/models"

	"gorm.io/gorm"
)

type TokenRepository interface {
	CreateSession(ctx context.Context, s *model.Session) error
	CreateRefreshToken(ctx context.Context, t *model.RefreshToken) error
	FindRefreshTokenByHash(ctx context.Context, hash string) (*model.RefreshToken, error)
	RevokeTokenFamily(ctx context.Context, familyID string) error
	DeleteRefreshToken(ctx context.Context, id uint) error
	DeleteSessionByID(ctx context.Context, id uint) error
	DeleteExpiredTokens(ctx context.Context) error
}

type tokenRepository struct {
	db *gorm.DB
}

func NewTokenRepository(db *gorm.DB) TokenRepository {
	return &tokenRepository{db: db}
}

func (r *tokenRepository) CreateSession(ctx context.Context, s *model.Session) error {
	return gorm.G[model.Session](r.db).Create(ctx, s)
}

func (r *tokenRepository) CreateRefreshToken(ctx context.Context, t *model.RefreshToken) error {
	return gorm.G[model.RefreshToken](r.db).Create(ctx, t)
}

func (r *tokenRepository) FindRefreshTokenByHash(ctx context.Context, hash string) (*model.RefreshToken, error) {
	t, err := gorm.G[model.RefreshToken](r.db).Where("token_hash = ?", hash).First(ctx)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *tokenRepository) RevokeTokenFamily(ctx context.Context, familyID string) error {
	_, err := gorm.G[model.RefreshToken](r.db).Where("family_id = ?", familyID).Update(ctx, "revoked", true)
	return err
}

func (r *tokenRepository) DeleteRefreshToken(ctx context.Context, id uint) error {
	_, err := gorm.G[model.RefreshToken](r.db).Where("id = ?", id).Delete(ctx)
	return err
}

func (r *tokenRepository) DeleteSessionByID(ctx context.Context, id uint) error {
	_, err := gorm.G[model.Session](r.db).Where("id = ?", id).Delete(ctx)
	return err
}

func (r *tokenRepository) DeleteExpiredTokens(ctx context.Context) error {
	_, err := gorm.G[model.RefreshToken](r.db).Where("expires_at < NOW()").Delete(ctx)
	return err
}
