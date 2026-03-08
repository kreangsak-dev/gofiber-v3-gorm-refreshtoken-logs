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
		// Logger: logger.Default.LogMode(logger.Info),
		Logger: logger.Default.LogMode(logger.Error),
	})
	if err != nil {
		log.Fatalf("Cannot connect DB %v", err)
	}

	// Log connect DB
	log.Println("Connected Database")

	// Connection pool
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("Cannot get sqlDB: %v", err)
	}
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return db
}
