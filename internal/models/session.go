package model

import (
	"time"

	"gorm.io/gorm"
)

type Session struct {
	// ID     uint `gorm:"primaryKey"`
	gorm.Model

	UserID uint `gorm:"not null;index"`
	User   User `gorm:"constraint:OnDelete:CASCADE"`

	UserAgent string `gorm:"size:255"`
	IPAddress string `gorm:"size:45"`

	ExpiresAt time.Time `gorm:"index"`
	CreatedAt time.Time
}
