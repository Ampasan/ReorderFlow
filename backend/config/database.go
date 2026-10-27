package config

import (
	"fmt"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var dbConnectBackoff = []time.Duration{2 * time.Second, 3 * time.Second, 5 * time.Second}

func NewDatabase(cfg *Config) (*gorm.DB, error) {
	dsn := buildDSN(cfg)

	var db *gorm.DB
	var err error

	for attempt := 0; attempt <= len(dbConnectBackoff); attempt++ {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Warn),
		})
		if err == nil {
			break
		}
		if attempt < len(dbConnectBackoff) {
			time.Sleep(dbConnectBackoff[attempt])
		}
	}
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(30 * time.Minute)
	sqlDB.SetConnMaxIdleTime(5 * time.Minute)

	return db, nil
}

func buildDSN(cfg *Config) string {
	if cfg.DatabaseURL != "" {
		return cfg.DatabaseURL
	}

	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=Asia/Jakarta",
		cfg.SupabaseDBHost,
		cfg.SupabaseDBPort,
		cfg.SupabaseDBUser,
		cfg.SupabaseDBPassword,
		cfg.SupabaseDBName,
		cfg.SupabaseDBSSLMode,
	)
}
