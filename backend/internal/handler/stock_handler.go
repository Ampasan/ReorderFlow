package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

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

func normalizeStokFilter(filter string) string {
	if filter == "low" || filter == "manual" {
		return filter
	}
	return "all"
}
