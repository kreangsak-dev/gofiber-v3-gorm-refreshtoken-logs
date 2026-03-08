package model

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Username string `gorm:"uniqueIndex;not null;size:100"`
	Password string `gorm:"not null"`
	Role     string `gorm:"type:varchar(20);not null;default:'user'"`
}
