package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

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

	if cfg.Env != "development" {
		gin.SetMode(gin.ReleaseMode)
	}

	db, err := config.NewDatabase(cfg)
	if err != nil {
		utils.Logger.Error("connect database failed", "error", err)
		panic(err)
	}

	if cfg.Env == "production" && cfg.JWTSecret == "dev-secret-change-me" {
		utils.Logger.Warn("JWT_SECRET masih memakai nilai default, ganti sebelum produksi")
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
	emailSender := utils.NewEmailSender(smtpCfg)
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
	scheduler.Start()

	router := gin.New()
	if len(cfg.TrustedProxies) > 0 {
		if err := router.SetTrustedProxies(cfg.TrustedProxies); err != nil {
			utils.Logger.Warn("trusted proxies configuration invalid", "error", err)
		}
	}
	router.Use(gin.Recovery(), middleware.Logger(), middleware.CORS(), middleware.Gzip())

	router.GET("/health", healthHandler)

	api := router.Group("/api")
	api.Use(middleware.RateLimit(rateLimiter, "api", cfg.RateLimitAPI, apiRateLimitWindow))
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
			protected.GET("/po-penerimaan/:id", penerimaanHandler.Get)
			protected.POST("/po-penerimaan/:id", middleware.RequireRole(model.RoleAdmin), penerimaanHandler.Create)
		}
	}

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
