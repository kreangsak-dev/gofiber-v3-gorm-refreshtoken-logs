package model

import "gorm.io/gorm"

type Product struct {
	gorm.Model
	Name        string  `gorm:"not null;size:255"`
	Description string  `gorm:"type:text"`
	Price       float64 `gorm:"not null;default:0"`
	Stock       int     `gorm:"not null;default:0"`
}
