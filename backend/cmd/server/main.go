package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"
	_ "time/tzdata"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"reorderflow-backend/config"
	"reorderflow-backend/internal/cache"
	"reorderflow-backend/internal/handler"
	"reorderflow-backend/internal/job"
	"reorderflow-backend/internal/middleware"
	"reorderflow-backend/internal/model"
	"reorderflow-backend/internal/ratelimit"
	"reorderflow-backend/internal/repository"
	"reorderflow-backend/internal/service"
	"reorderflow-backend/internal/utils"
)

const (
	loginRateLimitWindow    = 15 * time.Minute
	approvalRateLimitWindow = time.Minute
	apiRateLimitWindow      = time.Minute
)

func main() {
	cfg := config.Load()
	validateProductionConfig(cfg)

	if cfg.Env != "development" {
		gin.SetMode(gin.ReleaseMode)
	}

	db, err := config.NewDatabase(cfg)
	if err != nil {
		utils.Logger.Error("connect database failed", "error", err)
		panic(err)
	}

	if cfg.Env != "production" {
		if !db.Migrator().HasTable(&model.Stok{}) {
			if err := db.AutoMigrate(&model.Pemasok{}, &model.Stok{}, &model.POLog{}, &model.PODetail{}, &model.User{}, &model.StockOpname{}); err != nil {
				utils.Logger.Error("auto migrate failed", "error", err)
				panic(err)
			}
		}
		if err := db.AutoMigrate(&model.Penerimaan{}, &model.PenerimaanDetail{}); err != nil {
			utils.Logger.Error("auto migrate penerimaan failed", "error", err)
			panic(err)
		}
		if err := db.AutoMigrate(&model.PODetail{}); err != nil {
			utils.Logger.Error("auto migrate PO detail recommendations failed", "error", err)
			panic(err)
		}
	}

	go warmDatabase(db, 3)

	redisClient := config.NewRedisClient(cfg)
	var redisRepo *repository.RedisRepository
	if err := redisClient.Ping().Err(); err != nil {
		utils.Logger.Warn("redis unavailable, running with in-memory cache only", "error", err)
		redisRepo = repository.NewRedisRepository(nil)
	} else {
		redisRepo = repository.NewRedisRepository(redisClient)
	}

	stokRepo := repository.NewStokRepository(db)
	poRepo := repository.NewPORepository(db)
	pemasokRepo := repository.NewPemasokRepository(db)
	userRepo := repository.NewUserRepository(db)
	penerimaanRepo := repository.NewPenerimaanRepository(db)
	cacheStore := cache.New(redisRepo)
	rateLimiter := ratelimit.New(redisRepo)

	smtpCfg := config.NewSMTPConfig(cfg)
	emailSender := config.NewEmailSender(cfg)
	storage := utils.NewSupabaseStorage(cfg.SupabaseURL, cfg.SupabaseServiceRoleKey, cfg.SupabaseBucket)

	emailService := service.NewEmailService(emailSender, smtpCfg, cfg.AppURL)
	emailQueue := service.NewEmailQueue()
	var stockAI *service.StockAIService
	if cfg.GeminiAPIKey != "" {
		stockAI, err = service.NewStockAIService(cfg.GeminiAPIKey, cfg.GeminiModel)
		if err != nil {
			utils.Logger.Error("initialize Gemini failed", "error", err)
			panic(err)
		}
	}
	pdfService := service.NewPDFService(poRepo, pemasokRepo, storage, emailService)
	detectionService := service.NewDetectionService(stokRepo, poRepo, redisRepo, pdfService, stockAI)
	approvalService := service.NewApprovalService(poRepo, stokRepo, redisRepo, emailService, storage, emailQueue, cacheStore)
	draftService := service.NewDraftService(poRepo, stokRepo, storage, emailService, emailQueue, cacheStore)
	authService := service.NewAuthService(userRepo, cfg.JWTSecret, cfg.JWTExpiry)
	penerimaanService := service.NewPenerimaanService(penerimaanRepo, cacheStore)

	stockHandler := handler.NewStockHandler(detectionService, stokRepo, cacheStore, stockAI)
	dashboardHandler := handler.NewDashboardHandler(stokRepo, poRepo, cacheStore)
	approvalHandler := handler.NewApprovalHandler(approvalService, cacheStore)
	draftHandler := handler.NewDraftHandler(draftService, cacheStore)
	authHandler := handler.NewAuthHandler(authService, userRepo)
	penerimaanHandler := handler.NewPenerimaanHandler(penerimaanService)

	if err := authService.EnsureUser(cfg.AdminEmail, cfg.AdminPassword, "Andi Pratama", model.RoleAdmin); err != nil {
		utils.Logger.Error("ensure admin failed", "error", err)
	}
	if err := authService.EnsureUser(cfg.ManagerEmail, cfg.ManagerPassword, "Rina Anggraini", model.RoleManager); err != nil {
		utils.Logger.Error("ensure manager failed", "error", err)
	}

	lowStockJob := job.NewLowStockJob(detectionService)
	scheduler := job.NewScheduler(lowStockJob.Run)
	if cfg.EnableCron {
		scheduler.Start()
	} else {
		utils.Logger.Info("cron scheduler disabled by ENABLE_CRON=false")
	}

	router := gin.New()
	if err := router.SetTrustedProxies(cfg.TrustedProxies); err != nil {
		utils.Logger.Error("trusted proxies configuration invalid", "error", err)
		panic(err)
	}
	router.Use(gin.Recovery(), middleware.Logger(), middleware.SecurityHeaders(cfg.Env == "production"), middleware.CORS(cfg.CORSAllowedOrigins), middleware.Gzip())

	router.GET("/health", middleware.NoStore(), healthHandler)
	router.GET("/ready", middleware.NoStore(), readinessHandler(db))

	api := router.Group("/api")
	api.Use(middleware.NoStore(), middleware.RateLimit(rateLimiter, "api", cfg.RateLimitAPI, apiRateLimitWindow))
	{
		api.POST("/auth/login", middleware.LoginRateLimit(rateLimiter, cfg.RateLimitLogin, loginRateLimitWindow), authHandler.Login)
		api.GET("/po/approval", middleware.RateLimit(rateLimiter, "approval", cfg.RateLimitApproval, approvalRateLimitWindow), approvalHandler.Approval)

		protected := api.Group("")
		protected.Use(middleware.Auth(cfg.JWTSecret))
		{
			protected.GET("/auth/me", authHandler.Me)
			protected.GET("/stok", stockHandler.List)
			protected.POST("/stok/ai-analysis", middleware.RateLimit(rateLimiter, "gemini", 5, time.Minute), stockHandler.AnalyzeLowStock)
			protected.POST("/stok/scan", middleware.RequireRole(model.RoleAdmin), stockHandler.Scan)
			protected.PATCH("/stok/:sku", middleware.RequireRole(model.RoleAdmin), stockHandler.Opname)
			protected.GET("/dashboard", dashboardHandler.Summary)
			protected.GET("/po", dashboardHandler.ListPO)
			protected.GET("/po-log", dashboardHandler.ListPO)
			protected.GET("/po-draft/:id", draftHandler.Get)
			protected.PUT("/po-draft/:id", middleware.RequireRole(model.RoleAdmin), draftHandler.Update)
			protected.POST("/po-draft/:id/submit", middleware.RequireRole(model.RoleAdmin), draftHandler.Submit)
			protected.POST("/po-draft/:id/regenerate-pdf", middleware.RequireRole(model.RoleAdmin), draftHandler.RegeneratePDF)
			protected.POST("/po-draft/:id/resend-supplier", middleware.RequireRole(model.RoleAdmin), draftHandler.ResendSupplier)
			protected.GET("/po-penerimaan/:id", penerimaanHandler.Get)
			protected.POST("/po-penerimaan/:id", middleware.RequireRole(model.RoleAdmin), penerimaanHandler.Create)
		}
	}

	router.NoRoute(notFoundHandler)
	handler.RegisterFrontend(router, cfg.FrontendDist)

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      120 * time.Second,
		IdleTimeout:       60 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}

	go func() {
		utils.Logger.Info("server starting", "addr", srv.Addr, "env", cfg.Env)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			utils.Logger.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	scheduler.Stop()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		utils.Logger.Error("server shutdown failed", "error", err)
	}

	queueCtx, cancelQueue := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancelQueue()
	if err := emailQueue.Stop(queueCtx); err != nil {
		utils.Logger.Warn("email queue shutdown incomplete", "error", err)
	}

	if err := redisRepo.Close(); err != nil {
		utils.Logger.Warn("redis close failed", "error", err)
	}

	utils.Logger.Info("server stopped")
}

func validateProductionConfig(cfg *config.Config) {
	if cfg.Env != "production" {
		return
	}

	if len(cfg.JWTSecret) < 32 || cfg.JWTSecret == "dev-secret-change-me" {
		panic("JWT_SECRET production minimal 32 karakter dan tidak boleh memakai nilai default")
	}
	if cfg.AdminEmail == "" || cfg.AdminPassword == "" {
		panic("ADMIN_EMAIL dan ADMIN_PASSWORD wajib diisi di production")
	}
	if cfg.ManagerEmail == "" || cfg.ManagerPassword == "" {
		panic("MANAGER_EMAIL dan MANAGER_PASSWORD wajib diisi di production")
	}
	if cfg.FrontendDist == "" && len(cfg.CORSAllowedOrigins) == 0 {
		panic("CORS_ALLOWED_ORIGINS wajib diisi saat frontend dan backend berjalan di origin berbeda")
	}
	for _, origin := range cfg.CORSAllowedOrigins {
		if origin == "*" {
			panic("CORS_ALLOWED_ORIGINS tidak boleh memakai * di production")
		}
	}
	if !strings.HasPrefix(cfg.AppURL, "https://") {
		panic("APP_URL wajib memakai https di production")
	}
	if len(cfg.TrustedProxies) == 0 {
		utils.Logger.Warn("TRUSTED_PROXIES kosong; rate limit akan memakai alamat proxy, bukan IP client")
	}
	if cfg.ResendAPIKey == "" && (cfg.SMTPEmail == "" || cfg.SMTPPassword == "") {
		utils.Logger.Warn("konfigurasi email belum lengkap; isi RESEND_API_KEY atau SMTP_EMAIL/SMTP_PASSWORD agar email terkirim")
	}
}

func notFoundHandler(c *gin.Context) {
	requestPath := c.Request.URL.Path
	if requestPath == "/api" || strings.HasPrefix(requestPath, "/api/") {
		handler.Error(c, http.StatusNotFound, "Endpoint tidak ditemukan", nil)
		return
	}
	handler.Error(c, http.StatusNotFound, "Halaman tidak ditemukan", nil)
}

func warmDatabase(db *gorm.DB, connections int) {
	var wg sync.WaitGroup
	for i := 0; i < connections; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			var ok int
			_ = db.Raw("SELECT 1").Scan(&ok).Error
		}()
	}
	wg.Wait()
}

func healthHandler(c *gin.Context) {
	handler.Success(c, http.StatusOK, "ok", gin.H{"status": "healthy"})
}

func readinessHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		sqlDB, err := db.DB()
		if err != nil {
			handler.Error(c, http.StatusServiceUnavailable, "Database belum siap", err)
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()
		if err := sqlDB.PingContext(ctx); err != nil {
			handler.Error(c, http.StatusServiceUnavailable, "Database belum siap", err)
			return
		}

		handler.Success(c, http.StatusOK, "ready", gin.H{"status": "ready"})
	}
}
