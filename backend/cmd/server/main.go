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
	"reorderflow-backend/internal/repository"
	"reorderflow-backend/internal/service"
	"reorderflow-backend/internal/utils"
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

	if cfg.Env != "production" {
		if err := db.AutoMigrate(&model.Pemasok{}, &model.Stok{}, &model.POLog{}, &model.PODetail{}); err != nil {
			utils.Logger.Error("auto migrate failed", "error", err)
			panic(err)
		}
	}

	warmDatabase(db, 3)

	redisClient := config.NewRedisClient(cfg)
	if err := redisClient.Ping().Err(); err != nil {
		utils.Logger.Warn("redis ping failed", "error", err)
	}

	stokRepo := repository.NewStokRepository(db)
	poRepo := repository.NewPORepository(db)
	pemasokRepo := repository.NewPemasokRepository(db)
	redisRepo := repository.NewRedisRepository(redisClient)
	cacheStore := cache.New(redisRepo)

	smtpCfg := config.NewSMTPConfig(cfg)
	emailSender := utils.NewEmailSender(smtpCfg)
	storage := utils.NewSupabaseStorage(cfg.SupabaseURL, cfg.SupabaseServiceRoleKey, cfg.SupabaseBucket)

	emailService := service.NewEmailService(emailSender, smtpCfg, cfg.AppURL)
	pdfService := service.NewPDFService(poRepo, pemasokRepo, storage, emailService)
	detectionService := service.NewDetectionService(stokRepo, poRepo, redisRepo, pdfService)
	approvalService := service.NewApprovalService(poRepo, redisRepo, emailService, storage)

	stockHandler := handler.NewStockHandler(detectionService, stokRepo, cacheStore)
	dashboardHandler := handler.NewDashboardHandler(stokRepo, poRepo, cacheStore)
	approvalHandler := handler.NewApprovalHandler(approvalService, cacheStore)

	lowStockJob := job.NewLowStockJob(detectionService)
	scheduler := job.NewScheduler(lowStockJob.Run)
	scheduler.Start()

	router := gin.New()
	router.Use(gin.Recovery(), middleware.Logger(), middleware.CORS(), middleware.Gzip())

	router.GET("/health", healthHandler)

	api := router.Group("/api")
	{
		api.GET("/stok", stockHandler.List)
		api.POST("/stok/scan", stockHandler.Scan)
		api.GET("/dashboard", dashboardHandler.Summary)
		api.GET("/po", dashboardHandler.ListPO)
		api.GET("/po-log", dashboardHandler.ListPO)
		api.GET("/po/approval", approvalHandler.Approval)
	}

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

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		utils.Logger.Error("server shutdown failed", "error", err)
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
