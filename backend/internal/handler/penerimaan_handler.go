package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"reorderflow-backend/internal/model"
	"reorderflow-backend/internal/repository"
	"reorderflow-backend/internal/service"
)

type PenerimaanHandler struct {
	service *service.PenerimaanService
}

func NewPenerimaanHandler(penerimaan *service.PenerimaanService) *PenerimaanHandler {
	return &PenerimaanHandler{service: penerimaan}
}

func (h *PenerimaanHandler) Get(c *gin.Context) {
	poID, ok := parsePenerimaanPOID(c)
	if !ok {
		return
	}

	view, err := h.service.Get(poID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			Error(c, http.StatusNotFound, "PO tidak ditemukan", err.Error())
			return
		}
		Error(c, http.StatusInternalServerError, "Gagal mengambil data penerimaan", err.Error())
		return
	}

	Success(c, http.StatusOK, "Berhasil mengambil data penerimaan", view)
}

func (h *PenerimaanHandler) Create(c *gin.Context) {
	poID, ok := parsePenerimaanPOID(c)
	if !ok {
		return
	}

	var req model.CatatPenerimaanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, http.StatusBadRequest, "Qty penerimaan tidak valid", err.Error())
		return
	}

	rawUserID, exists := c.Get("user_id")
	if !exists {
		Error(c, http.StatusUnauthorized, "Token tidak valid", "user_id not found")
		return
	}

	po, err := h.service.Record(c.Request.Context(), poID, rawUserID.(int64), req.Items)
	if err != nil {
		respondPenerimaanError(c, err)
		return
	}

	Success(c, http.StatusOK, "Penerimaan barang berhasil dicatat", po)
}

func parsePenerimaanPOID(c *gin.Context) (int64, bool) {
	poID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || poID <= 0 {
		Error(c, http.StatusBadRequest, "ID PO tidak valid", "id harus angka positif")
		return 0, false
	}
	return poID, true
}

func respondPenerimaanError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, gorm.ErrRecordNotFound):
		Error(c, http.StatusNotFound, "PO tidak ditemukan", err.Error())
	case errors.Is(err, repository.ErrPONotReceivable):
		Error(c, http.StatusConflict, "PO ini tidak bisa menerima barang", err.Error())
	case errors.Is(err, repository.ErrPenerimaanEmpty),
		errors.Is(err, repository.ErrPenerimaanItemInvalid),
		errors.Is(err, repository.ErrQtyOverRemaining):
		Error(c, http.StatusBadRequest, "Data penerimaan tidak valid", err.Error())
	default:
		Error(c, http.StatusInternalServerError, "Gagal mencatat penerimaan barang", err.Error())
	}
}
