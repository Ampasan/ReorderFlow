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
)

type StockHandler struct {
	detection *service.DetectionService
	stokRepo  *repository.StokRepository
	cache     *cache.Cache
}

func NewStockHandler(detection *service.DetectionService, stokRepo *repository.StokRepository, cacheStore *cache.Cache) *StockHandler {
	return &StockHandler{
		detection: detection,
		stokRepo:  stokRepo,
		cache:     cacheStore,
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
		"sku":          updated.SKU,
		"stok_saat_ini": updated.StokSaatIni,
	})
}

func normalizeStokFilter(filter string) string {
	if filter == "low" || filter == "manual" {
		return filter
	}
	return "all"
}
