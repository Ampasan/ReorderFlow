package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"reorderflow-backend/internal/cache"
	"reorderflow-backend/internal/service"
)

type DraftHandler struct {
	drafts *service.DraftService
	cache  *cache.Cache
}

func NewDraftHandler(drafts *service.DraftService, cacheStore *cache.Cache) *DraftHandler {
	return &DraftHandler{drafts: drafts, cache: cacheStore}
}

func (h *DraftHandler) Get(c *gin.Context) {
	id, ok := parseDraftID(c)
	if !ok {
		return
	}

	po, err := h.drafts.Get(id)
	if err != nil {
		h.respondError(c, err)
		return
	}

	Success(c, http.StatusOK, "Berhasil mengambil draf PO", po)
}

func (h *DraftHandler) Update(c *gin.Context) {
	id, ok := parseDraftID(c)
	if !ok {
		return
	}

	var req service.UpdateDraftRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, http.StatusBadRequest, "Daftar barang draf tidak valid", err.Error())
		return
	}

	po, err := h.drafts.Update(c.Request.Context(), id, req.Items)
	if err != nil {
		h.respondError(c, err)
		return
	}

	h.cache.Invalidate()
	Success(c, http.StatusOK, "Draf PO berhasil disimpan", po)
}

func (h *DraftHandler) Submit(c *gin.Context) {
	id, ok := parseDraftID(c)
	if !ok {
		return
	}

	po, err := h.drafts.Submit(c.Request.Context(), id)
	if err != nil {
		h.respondError(c, err)
		return
	}

	h.cache.Invalidate()
	Success(c, http.StatusOK, "Draf PO dikirim ke manajer", po)
}

func parseDraftID(c *gin.Context) (int64, bool) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		Error(c, http.StatusBadRequest, "ID draf PO tidak valid", "invalid po id")
		return 0, false
	}
	return id, true
}

func (h *DraftHandler) respondError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, gorm.ErrRecordNotFound):
		Error(c, http.StatusNotFound, "Draf PO tidak ditemukan", err.Error())
	case errors.Is(err, service.ErrPONotDraft):
		Error(c, http.StatusConflict, "PO ini tidak bisa diubah pada status sekarang", err.Error())
	case errors.Is(err, service.ErrDraftEmpty):
		Error(c, http.StatusBadRequest, "Draf PO harus berisi minimal satu barang", err.Error())
	case errors.Is(err, service.ErrDraftItemInvalid):
		Error(c, http.StatusBadRequest, "Barang draf tidak valid", err.Error())
	case errors.Is(err, service.ErrDraftSupplierMismatch):
		Error(c, http.StatusBadRequest, "Barang bukan milik pemasok PO ini", err.Error())
	case errors.Is(err, service.ErrSupplierEmailInvalid):
		Error(c, http.StatusBadRequest, "Email pemasok tidak valid, perbaiki data pemasok terlebih dahulu", err.Error())
	case errors.Is(err, service.ErrDraftPDFFailed):
		Error(c, http.StatusBadGateway, "Dokumen PDF gagal disiapkan, coba lagi", err.Error())
	case errors.Is(err, service.ErrManagerEmailFailed):
		Error(c, http.StatusBadGateway, "Draf tersimpan tetapi email ke manajer gagal dikirim. PO ditandai untuk peninjauan manual.", err.Error())
	default:
		Error(c, http.StatusInternalServerError, "Gagal memproses draf PO", err.Error())
	}
}
