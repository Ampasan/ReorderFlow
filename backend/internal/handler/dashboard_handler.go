package handler

import (
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"

	"reorderflow-backend/internal/cache"
	"reorderflow-backend/internal/model"
	"reorderflow-backend/internal/repository"
)

type DashboardHandler struct {
	stokRepo *repository.StokRepository
	poRepo   *repository.PORepository
	cache    *cache.Cache
}

func NewDashboardHandler(stokRepo *repository.StokRepository, poRepo *repository.PORepository, cacheStore *cache.Cache) *DashboardHandler {
	return &DashboardHandler{
		stokRepo: stokRepo,
		poRepo:   poRepo,
		cache:    cacheStore,
	}
}

func (h *DashboardHandler) Summary(c *gin.Context) {
	var summary model.DashboardSummary
	if h.cache.Get(cache.KeyDashboard, &summary) {
		Success(c, http.StatusOK, "Berhasil mengambil ringkasan dashboard", summary)
		return
	}

	var (
		stokCounts repository.StockCountSummary
		poCounts   map[string]int64
		stokErr    error
		poErr      error
		wg         sync.WaitGroup
	)

	wg.Add(2)
	go func() {
		defer wg.Done()
		stokCounts, stokErr = h.stokRepo.CountSummary()
	}()
	go func() {
		defer wg.Done()
		poCounts, poErr = h.poRepo.StatusCounts()
	}()
	wg.Wait()

	if stokErr != nil {
		Error(c, http.StatusInternalServerError, "Gagal mengambil ringkasan dashboard", stokErr.Error())
		return
	}
	if poErr != nil {
		Error(c, http.StatusInternalServerError, "Gagal mengambil ringkasan dashboard", poErr.Error())
		return
	}

	summary = model.DashboardSummary{
		TotalSKU:        stokCounts.Total,
		LowStockCount:   stokCounts.LowStock,
		ManualReview:    stokCounts.ManualReview,
		DraftPOCount:    poCounts[model.POStatusDraft],
		PendingPOCount:  poCounts[model.POStatusPendingApproval],
		SentPOCount:     poCounts[model.POStatusSent],
		RejectedPOCount: poCounts[model.POStatusRejected],
	}

	h.cache.Set(cache.KeyDashboard, summary)
	Success(c, http.StatusOK, "Berhasil mengambil ringkasan dashboard", summary)
}

func (h *DashboardHandler) ListPO(c *gin.Context) {
	filter := c.DefaultQuery("status", "all")
	key, cacheable := cache.POKey(filter)

	var list []model.POLog
	if cacheable && h.cache.Get(key, &list) {
		Success(c, http.StatusOK, "Berhasil mengambil riwayat PO", list)
		return
	}

	list, err := h.poRepo.List(filter)
	if err != nil {
		Error(c, http.StatusInternalServerError, "Gagal mengambil riwayat PO", err.Error())
		return
	}

	if cacheable {
		h.cache.Set(key, list)
	}
	Success(c, http.StatusOK, "Berhasil mengambil riwayat PO", list)
}
