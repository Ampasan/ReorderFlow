package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"reorderflow-backend/internal/cache"
	"reorderflow-backend/internal/model"
	"reorderflow-backend/internal/repository"
	"reorderflow-backend/internal/service"
	"reorderflow-backend/internal/utils"
)

type StockHandler struct {
	detection *service.DetectionService
	stokRepo  *repository.StokRepository
	cache     *cache.Cache
	stockAI   *service.StockAIService
}

func NewStockHandler(detection *service.DetectionService, stokRepo *repository.StokRepository, cacheStore *cache.Cache, stockAI *service.StockAIService) *StockHandler {
	return &StockHandler{
		detection: detection,
		stokRepo:  stokRepo,
		cache:     cacheStore,
		stockAI:   stockAI,
	}
}

func (h *StockHandler) Scan(c *gin.Context) {
	result, err := h.detection.RunScan(c.Request.Context())
	if err != nil {
		if errors.Is(err, service.ErrScanInProgress) {
			Error(c, http.StatusConflict, "Pemindaian sedang berlangsung", err.Error())
			return
		}
		Error(c, http.StatusInternalServerError, "Gagal menjalankan pemindaian stok", err.Error())
		return
	}

	h.cache.Invalidate()
	Success(c, http.StatusOK, "Pemindaian stok berhasil dijalankan", result)
}

func (h *StockHandler) List(c *gin.Context) {
	filter := normalizeStokFilter(c.DefaultQuery("status", "all"))
	key := cache.StokKey(filter)

	var view []model.StockItem
	if h.cache.Get(key, &view) {
		Success(c, http.StatusOK, "Berhasil mengambil data stok", view)
		return
	}

	items, err := h.stokRepo.List(filter)
	if err != nil {
		Error(c, http.StatusInternalServerError, "Gagal mengambil data stok", err.Error())
		return
	}

	view = make([]model.StockItem, 0, len(items))
	for _, item := range items {
		view = append(view, model.NewStockItem(item))
	}

	h.cache.Set(key, view)
	Success(c, http.StatusOK, "Berhasil mengambil data stok", view)
}

func (h *StockHandler) AnalyzeLowStock(c *gin.Context) {
	if h.stockAI == nil {
		Error(c, http.StatusServiceUnavailable, "Analisis Gemini belum dikonfigurasi. Atur GEMINI_API_KEY pada backend.", nil)
		return
	}

	items, err := h.stokRepo.List("low")
	if err != nil {
		Error(c, http.StatusInternalServerError, "Gagal mengambil data stok", err.Error())
		return
	}
	analysis, err := h.stockAI.AnalyzeLowStock(c.Request.Context(), items)
	if err != nil {
		utils.Logger.Error("Gemini low-stock analysis failed", "error", err)
		Error(c, http.StatusBadGateway, "Analisis Gemini gagal. Coba lagi nanti.", err.Error())
		return
	}

	Success(c, http.StatusOK, "Analisis stok berhasil", analysis)
}

func (h *StockHandler) Opname(c *gin.Context) {
	sku := c.Param("sku")

	var req model.StockOpnameRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, http.StatusBadRequest, "Stok hasil opname dan alasan wajib diisi dengan benar", err.Error())
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		Error(c, http.StatusUnauthorized, "Token tidak valid", "user_id not found")
		return
	}

	updated, err := h.stokRepo.RecordOpname(sku, *req.StokSaatIni, req.Alasan, userID.(int64))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			Error(c, http.StatusNotFound, "SKU tidak ditemukan", err.Error())
			return
		}
		Error(c, http.StatusInternalServerError, "Gagal memperbarui stok", err.Error())
		return
	}

	h.cache.Invalidate()
	Success(c, http.StatusOK, "Stok berhasil diperbarui", gin.H{
		"sku":           updated.SKU,
		"stok_saat_ini": updated.StokSaatIni,
	})
}

func normalizeStokFilter(filter string) string {
	if filter == "low" || filter == "manual" {
		return filter
	}
	return "all"
}
