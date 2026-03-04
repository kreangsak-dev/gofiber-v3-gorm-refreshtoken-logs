package database

import (
	"log"
	"nurse-table/internal/config"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(cfg *config.Config) *gorm.DB {
	dsn := cfg.DatabaseURL

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Cannot connect DB %v", err)
	}

	// Connection pool ตาม GORM docs
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("Cannot get sqlDB: %v", err)
	}
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("Connected Database")
	return db
}
