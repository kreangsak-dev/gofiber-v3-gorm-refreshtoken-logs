package model

import (
	"time"

	"gorm.io/gorm"
)

type RefreshToken struct {
	// ID uint `gorm:"primaryKey"`
	gorm.Model

	UserID    uint `gorm:"not null;index"`
	User      User `gorm:"constraint:OnDelete:CASCADE"`
	SessionID uint `gorm:"not null;index"`

	TokenHash string `gorm:"size:64;not null;uniqueIndex"`

	FamilyID string `gorm:"size:36;index"`
	Revoked  bool   `gorm:"default:false"`

	ExpiresAt time.Time `gorm:"not null;index"`
	CreatedAt time.Time
}
