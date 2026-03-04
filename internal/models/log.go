package model

import "time"

type SystemLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Level     string    `gorm:"size:20" json:"level"` // info, error, warning
	Type      string    `gorm:"size:50" json:"type"`  // system, auth, app
	Message   string    `gorm:"type:text" json:"message"`
	UserID    *uint     `json:"user_id"` // nullable
	IP        string    `gorm:"size:50" json:"ip"`
	URL       string    `gorm:"size:255" json:"url"`
	Method    string    `gorm:"size:10" json:"method"`
	CreatedAt time.Time `json:"created_at"`
}
