package service

import (
	"context"
	"errors"
	"fmt"
	"nurse-table/internal/dto"
	model "nurse-table/internal/models"
	repository "nurse-table/internal/repositories"
	"nurse-table/internal/utils/logger"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService interface {
	Register(ctx context.Context, req *dto.RegisterRequest) (*dto.AuthResponse, error)
	Login(ctx context.Context, req *dto.LoginRequest) (*dto.AuthResponse, error)
	Refresh(ctx context.Context, req *dto.RefreshRequest) (*dto.AuthResponse, error)
}

type authService struct {
	repo      repository.UserRepository
	jwtSecret []byte
}

func NewAuthService(repo repository.UserRepository, jwtSecret string) AuthService {
	return &authService{
		repo:      repo,
		jwtSecret: []byte(jwtSecret),
	}
}

func (s *authService) Register(ctx context.Context, req *dto.RegisterRequest) (*dto.AuthResponse, error) {
	// ตรวจว่า username ซ้ำหรือไม่
	_, err := s.repo.FindByUsername(ctx, req.Username)
	if err == nil {
		return nil, ErrDuplicate
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("Register FindByUsername: %w", err)
	}

	// Hash password
	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("Register hash password: %w", err)
	}

	user := &model.User{
		Username: req.Username,
		Password: string(hashed),
	}

	if err := s.repo.Create(ctx, user); err != nil {
		logger.ErrorAuth("Register failed to create user: "+req.Username, "", "", "", nil)
		return nil, fmt.Errorf("Register create user: %w", err)
	}

	logger.InfoAuth("User registered successfully: "+req.Username, "", "", "", &user.ID)
	return s.generateTokenPair(user)
}

func (s *authService) Login(ctx context.Context, req *dto.LoginRequest) (*dto.AuthResponse, error) {
	user, err := s.repo.FindByUsername(ctx, req.Username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fiber401Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
		}
		return nil, fmt.Errorf("Login FindByUsername: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		logger.ErrorAuth("Login failed (wrong password) for: "+req.Username, "", "", "", &user.ID)
		return nil, fiber401Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
	}

	logger.InfoAuth("User logged in successfully: "+req.Username, "", "", "", &user.ID)
	return s.generateTokenPair(user)
}

func (s *authService) Refresh(ctx context.Context, req *dto.RefreshRequest) (*dto.AuthResponse, error) {
	// Parse refresh token
	token, err := jwt.Parse(req.RefreshToken, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return s.jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return nil, fiber401Error("refresh token ไม่ถูกต้องหรือหมดอายุ")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fiber401Error("refresh token ไม่ถูกต้อง")
	}

	// ตรวจว่าเป็น refresh token จริง (ไม่ใช่ access token)
	tokenType, _ := claims["type"].(string)
	if tokenType != "refresh" {
		return nil, fiber401Error("token ไม่ใช่ refresh token")
	}

	// ดึง user_id จาก claims
	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		return nil, fiber401Error("refresh token ไม่ถูกต้อง")
	}

	user, err := s.repo.FindByID(ctx, uint(userIDFloat))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fiber401Error("ไม่พบผู้ใช้")
		}
		return nil, fmt.Errorf("Refresh FindByID: %w", err)
	}

	return s.generateTokenPair(user)
}

// --- Token Helpers ---

func (s *authService) generateTokenPair(user *model.User) (*dto.AuthResponse, error) {
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}

	refreshToken, err := s.generateRefreshToken(user)
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}

	return &dto.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *authService) generateAccessToken(user *model.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"type":     "access",
		"exp":      time.Now().Add(15 * time.Minute).Unix(),
		"iat":      time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

func (s *authService) generateRefreshToken(user *model.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"type":    "refresh",
		"exp":     time.Now().Add(7 * 24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}
