package config

import (
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port   string
	Env    string
	AppURL string

	FrontendDist string

	JWTSecret string
	JWTExpiry time.Duration

	AdminEmail      string
	AdminPassword   string
	ManagerPassword string

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
	RedisTLS      bool

	DBMaxOpenConns int
	DBMaxIdleConns int

	EnableCron bool

	TrustedProxies     []string
	CORSAllowedOrigins []string

	RateLimitLogin    int
	RateLimitApproval int
	RateLimitAPI      int

	SMTPHost     string
	SMTPPort     int
	SMTPEmail    string
	SMTPPassword string
	ManagerEmail string

	GeminiAPIKey string
	GeminiModel  string
}

func Load() *Config {
	_ = godotenv.Load()

	env := strings.ToLower(strings.TrimSpace(getEnv("ENV", "development")))
	corsAllowedOrigins := normalizeOrigins(getEnv("CORS_ALLOWED_ORIGINS", ""))
	if len(corsAllowedOrigins) == 0 && env != "production" {
		corsAllowedOrigins = []string{"*"}
	}

	return &Config{
		Port:   getEnv("PORT", "8080"),
		Env:    env,
		AppURL: strings.TrimRight(getEnv("APP_URL", "http://localhost:8080"), "/"),

		FrontendDist: getEnv("FRONTEND_DIST", ""),

		JWTSecret: getEnv("JWT_SECRET", "dev-secret-change-me"),
		JWTExpiry: time.Duration(getEnvInt("JWT_TTL_HOURS", 24)) * time.Hour,

		AdminEmail:      getEnv("ADMIN_EMAIL", ""),
		AdminPassword:   getEnv("ADMIN_PASSWORD", ""),
		ManagerPassword: getEnv("MANAGER_PASSWORD", ""),

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
		RedisTLS:      getEnvBool("REDIS_TLS", false),

		DBMaxOpenConns: getEnvInt("DB_MAX_OPEN_CONNS", 25),
		DBMaxIdleConns: getEnvInt("DB_MAX_IDLE_CONNS", 15),

		EnableCron: getEnvBool("ENABLE_CRON", true),

		TrustedProxies:     splitList(getEnv("TRUSTED_PROXIES", "")),
		CORSAllowedOrigins: corsAllowedOrigins,

		RateLimitLogin:    getEnvInt("RATE_LIMIT_LOGIN", 10),
		RateLimitApproval: getEnvInt("RATE_LIMIT_APPROVAL", 30),
		RateLimitAPI:      getEnvInt("RATE_LIMIT_API", 120),

		SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:     getEnvInt("SMTP_PORT", 587),
		SMTPEmail:    getEnv("SMTP_EMAIL", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		ManagerEmail: getEnv("MANAGER_EMAIL", ""),

		GeminiAPIKey: strings.TrimSpace(getEnv("GEMINI_API_KEY", "")),
		GeminiModel:  getEnv("GEMINI_MODEL", "gemini-flash-lite-latest"),
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

func getEnvBool(key string, fallback bool) bool {
	if v := strings.TrimSpace(strings.ToLower(os.Getenv(key))); v != "" {
		switch v {
		case "1", "true", "yes", "on":
			return true
		case "0", "false", "no", "off":
			return false
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

func normalizeOrigins(v string) []string {
	parts := splitList(v)
	for i, part := range parts {
		parts[i] = strings.ToLower(strings.TrimRight(part, "/"))
	}
	return parts
}

func splitList(v string) []string {
	if strings.TrimSpace(v) == "" {
		return nil
	}

	parts := strings.Split(v, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}
