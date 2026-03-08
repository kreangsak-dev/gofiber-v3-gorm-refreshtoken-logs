package service

import (
	"context"
	"errors"
	"fmt"
	"nurse-table/internal/dto"
	"nurse-table/internal/logger"
	model "nurse-table/internal/models"
	repository "nurse-table/internal/repositories"
	"nurse-table/internal/utils"
	"sync"
	"time"

	fiberutils "github.com/gofiber/utils/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService interface {
	Register(ctx context.Context, req *dto.RegisterRequest, ip, userAgent string) (*dto.AuthResponse, error)
	Login(ctx context.Context, req *dto.LoginRequest, ip, userAgent string) (*dto.AuthResponse, error)
	Refresh(ctx context.Context, rawToken string) (*dto.AuthResponse, error)
	Logout(ctx context.Context, rawToken string) error
}

type authService struct {
	userRepo   repository.UserRepository
	tokenRepo  repository.TokenRepository
	jwtSecret  []byte
	refreshMap sync.Map // ใช้แก้ปัญหา Race Condition ตอนยิง Refresh พร้อมกัน
}

func NewAuthService(userRepo repository.UserRepository, tokenRepo repository.TokenRepository, jwtSecret string) AuthService {
	return &authService{
		userRepo:  userRepo,
		tokenRepo: tokenRepo,
		jwtSecret: []byte(jwtSecret),
	}
}

// ──────────────────────────────────────────────
//  Register
// ──────────────────────────────────────────────

func (s *authService) Register(ctx context.Context, req *dto.RegisterRequest, ip, userAgent string) (*dto.AuthResponse, error) {
	// ตรวจว่า username ซ้ำหรือไม่
	_, err := s.userRepo.FindByUsername(ctx, req.Username)
	if err == nil {
		return nil, ErrDuplicate
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("register FindByUsername: %w", err)
	}

	// Hash password
	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("register hash password: %w", err)
	}

	user := &model.User{
		Username: req.Username,
		Password: string(hashed),
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		logger.ErrorAuth("Register failed to create user: "+req.Username, ip, "", "", nil)
		return nil, fmt.Errorf("register create user: %w", err)
	}

	logger.InfoAuth("User registered: "+req.Username, ip, "", "", &user.ID)
	return s.createSession(ctx, user, ip, userAgent)
}

// ──────────────────────────────────────────────
//  Login
// ──────────────────────────────────────────────

func (s *authService) Login(ctx context.Context, req *dto.LoginRequest, ip, userAgent string) (*dto.AuthResponse, error) {
	user, err := s.userRepo.FindByUsername(ctx, req.Username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fiber401Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
		}
		return nil, fmt.Errorf("login FindByUsername: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		logger.ErrorAuth("Login failed (wrong password) for: "+req.Username, ip, "", "", &user.ID)
		return nil, fiber401Error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
	}

	logger.InfoAuth("User logged in: "+req.Username, ip, "", "", &user.ID)
	return s.createSession(ctx, user, ip, userAgent)
}

// ──────────────────────────────────────────────
//  Refresh (Token Rotation)
// ──────────────────────────────────────────────

func (s *authService) Refresh(ctx context.Context, rawToken string) (*dto.AuthResponse, error) {
	hash := utils.HashToken(rawToken)

	// --- 0. Race Condition Protection ---
	// ถ้ามี request อื่นกำลัง refresh token นี้อยู่ ให้รอจนกว่าจะเสร็จ
	// โหลดเข้า map, ถ้ามีอยู่แล้ว load = true, ถ้าไม่มี load = false และใส่ channel ทันที
	actual, loaded := s.refreshMap.LoadOrStore(hash, make(chan struct{}))
	done := actual.(chan struct{})

	if loaded {
		// ถ้ามีคนกำลังทำอยู่ ให้รอจนกว่า request แรกจะทำงานเสร็จ (บล็อคจนกว่า channel จะถูกปิด)
		<-done

		// พอคนแรกทำเสร็จ Token เราจะถือว่า "ใช้ไปแล้ว" เราจะตีตกไปเลย เพื่อป้องกัน duplicate token
		// frontend ที่ได้ 401 ของ request ที่ 2-3 จะต้อง handle retry loop เอง หรือให้ใช้ token ใหม่
		return nil, fiber401Error("token นี้กำลังถูกรีเฟรชหรือถูกใช้ไปแล้ว")
	}

	// ถ้าเราเป็นคนแรกที่เข้าถึง (load = false)
	defer func() {
		close(done)               // แจ้งเตือน goroutine อื่นที่รออยู่ว่าทำงานเสร็จแล้ว (ปลดบล็อค <-done)
		s.refreshMap.Delete(hash) // ลบออกจาก map เมื่อทำเสร็จ
	}()

	// 1. ค้นหา token ใน DB
	stored, err := s.tokenRepo.FindRefreshTokenByHash(ctx, hash)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fiber401Error("refresh token ไม่ถูกต้องหรือใช้ไปแล้ว")
		}
		return nil, fmt.Errorf("refresh FindToken: %w", err)
	}

	// 2. Token Theft Detection — ถ้า token ถูก revoke แล้วแต่มีคนใช้อีก
	if stored.Revoked {
		logger.ErrorAuth("Token theft detected! Revoking family: "+stored.FamilyID, "", "", "", &stored.UserID)
		_ = s.tokenRepo.RevokeTokenFamily(ctx, stored.FamilyID)
		return nil, fiber401Error("ตรวจพบการใช้ token ซ้ำ กรุณาเข้าสู่ระบบใหม่")
	}

	// 3. ตรวจหมดอายุ
	if time.Now().After(stored.ExpiresAt) {
		return nil, fiber401Error("refresh token หมดอายุ")
	}

	// 4. ลบ token เก่าทิ้ง
	if err := s.tokenRepo.DeleteRefreshToken(ctx, stored.ID); err != nil {
		return nil, fmt.Errorf("refresh DeleteToken: %w", err)
	}

	// 5. ดึง user
	user, err := s.userRepo.FindByID(ctx, stored.UserID)
	if err != nil {
		return nil, fmt.Errorf("refresh FindByID: %w", err)
	}

	// 6. สร้าง token ใหม่ด้วย family เดิม (rotation)
	return s.issueTokenPair(ctx, user, stored.SessionID, stored.FamilyID)
}

// ──────────────────────────────────────────────
//  Logout
// ──────────────────────────────────────────────

func (s *authService) Logout(ctx context.Context, rawToken string) error {
	if rawToken == "" {
		return nil // ไม่มี token ก็ logout ได้เลย
	}

	hash := utils.HashToken(rawToken)
	stored, err := s.tokenRepo.FindRefreshTokenByHash(ctx, hash)
	if err != nil {
		return nil // token หาไม่เจอ ก็ถือว่า logout แล้ว
	}

	// ลบ token + session
	_ = s.tokenRepo.DeleteRefreshToken(ctx, stored.ID)
	_ = s.tokenRepo.DeleteSessionByID(ctx, stored.SessionID)

	logger.InfoAuth("User logged out", "", "", "", &stored.UserID)
	return nil
}

// ──────────────────────────────────────────────
//  Internal Helpers
// ──────────────────────────────────────────────

// createSession สร้าง session + token pair ใหม่ (ตอน register/login)
func (s *authService) createSession(ctx context.Context, user *model.User, ip, userAgent string) (*dto.AuthResponse, error) {
	session := &model.Session{
		UserID:    user.ID,
		UserAgent: userAgent,
		IPAddress: ip,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	}

	if err := s.tokenRepo.CreateSession(ctx, session); err != nil {
		return nil, fmt.Errorf("create session: %w", err)
	}

	familyID := fiberutils.UUIDv4()
	return s.issueTokenPair(ctx, user, session.ID, familyID)
}

// issueTokenPair สร้าง access JWT + random refresh token แล้วเก็บ hash ใน DB
func (s *authService) issueTokenPair(ctx context.Context, user *model.User, sessionID uint, familyID string) (*dto.AuthResponse, error) {
	// Access Token (JWT)
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}

	// Refresh Token (random + hash → DB)
	rawToken, err := utils.GenerateToken()
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}

	rt := &model.RefreshToken{
		UserID:    user.ID,
		SessionID: sessionID,
		TokenHash: utils.HashToken(rawToken),
		FamilyID:  familyID,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	}

	if err := s.tokenRepo.CreateRefreshToken(ctx, rt); err != nil {
		return nil, fmt.Errorf("store refresh token: %w", err)
	}

	return &dto.AuthResponse{
		UserID:       user.ID,
		AccessToken:  accessToken,
		RefreshToken: rawToken,
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
