package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port   string
	Env    string
	AppURL string

	DatabaseURL string

	SupabaseDBHost     string
	SupabaseDBPort     string
	SupabaseDBUser     string
	SupabaseDBPassword string
	SupabaseDBName     string
	SupabaseDBSSLMode  string

	SupabaseURL            string
	SupabaseServiceRoleKey string
	SupabaseBucket         string

	RedisAddr     string
	RedisPassword string

	SMTPHost     string
	SMTPPort     int
	SMTPEmail    string
	SMTPPassword string
	ManagerEmail string
}

func Load() *Config {
	_ = godotenv.Load()

	return &Config{
		Port:   getEnv("PORT", "8080"),
		Env:    getEnv("ENV", "development"),
		AppURL: getEnv("APP_URL", "http://localhost:8080"),

		DatabaseURL: getEnv("DATABASE_URL", ""),

		SupabaseDBHost:     getEnv("SUPABASE_DB_HOST", "localhost"),
		SupabaseDBPort:     getEnv("SUPABASE_DB_PORT", "5432"),
		SupabaseDBUser:     getEnv("SUPABASE_DB_USER", "postgres"),
		SupabaseDBPassword: getEnv("SUPABASE_DB_PASSWORD", ""),
		SupabaseDBName:     getEnv("SUPABASE_DB_NAME", "postgres"),
		SupabaseDBSSLMode:  getEnv("SUPABASE_DB_SSLMODE", "require"),

		SupabaseURL:            getEnv("SUPABASE_URL", ""),
		SupabaseServiceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY", ""),
		SupabaseBucket:         getEnv("SUPABASE_BUCKET_NAME", "po-documents"),

		RedisAddr:     getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword: normalizeOptional(getEnv("REDIS_PASSWORD", "")),

		SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:     getEnvInt("SMTP_PORT", 587),
		SMTPEmail:    getEnv("SMTP_EMAIL", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		ManagerEmail: getEnv("MANAGER_EMAIL", ""),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}

func normalizeOptional(v string) string {
	if v == "null" || v == "none" {
		return ""
	}
	return v
}
