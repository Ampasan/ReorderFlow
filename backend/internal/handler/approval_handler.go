package handler

import (
	"errors"
	"fmt"
	"html"
	"net/http"

	"github.com/gin-gonic/gin"

	"reorderflow-backend/internal/cache"
	"reorderflow-backend/internal/service"
)

type ApprovalHandler struct {
	approval *service.ApprovalService
	cache    *cache.Cache
}

func NewApprovalHandler(approval *service.ApprovalService, cacheStore *cache.Cache) *ApprovalHandler {
	return &ApprovalHandler{approval: approval, cache: cacheStore}
}

func (h *ApprovalHandler) Approval(c *gin.Context) {
	token := c.Query("token")
	action := c.Query("action")

	outcome, err := h.approval.ProcessApproval(c.Request.Context(), token, action)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrTokenNotFound):
			h.render(c, http.StatusNotFound, "Token Tidak Valid",
				"Token persetujuan tidak ditemukan atau sudah kedaluwarsa.", "", "", "red")
		case errors.Is(err, service.ErrInvalidAction):
			h.render(c, http.StatusBadRequest, "Action Tidak Valid",
				"Parameter action harus approve atau reject.", "", "", "red")
		default:
			h.render(c, http.StatusInternalServerError, "Terjadi Kesalahan",
				"Gagal memproses persetujuan. Silakan coba lagi.", "", "", "red")
		}
		return
	}

	h.cache.Invalidate()

	switch {
	case outcome.Expired:
		h.render(c, http.StatusOK, "Tautan Kedaluwarsa", outcome.Message, outcome.NomorPO, outcome.Status, "red")
	case outcome.Used:
		h.render(c, http.StatusOK, "Tautan Sudah Digunakan", outcome.Message, outcome.NomorPO, outcome.Status, "amber")
	default:
		h.render(c, http.StatusOK, "Persetujuan Berhasil", outcome.Message, outcome.NomorPO, outcome.Status, "green")
	}
}

func (h *ApprovalHandler) render(c *gin.Context, status int, title, message, nomorPO, poStatus, color string) {
	c.Data(status, "text/html; charset=utf-8", []byte(approvalPage(title, message, nomorPO, poStatus, color)))
}

func approvalPage(title, message, nomorPO, poStatus, color string) string {
	accent := map[string]string{
		"green": "#047857",
		"amber": "#D97706",
		"red":   "#BE123C",
	}[color]
	if accent == "" {
		accent = "#2A1A0E"
	}

	var statusLine string
	if nomorPO != "" {
		statusLine = fmt.Sprintf(
			`<p style="margin:0 0 16px;">Status PO <strong>#%s</strong>: <strong>%s</strong></p>`,
			html.EscapeString(nomorPO),
			html.EscapeString(poStatus),
		)
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Persetujuan PO ReorderFlow</title>
</head>
<body style="margin:0;padding:40px 16px;background:#FEF3E2;font-family:Arial,Helvetica,sans-serif;color:#2A1A0E;">
<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #EAD8C0;border-radius:16px;padding:0;overflow:hidden;box-shadow:0 8px 24px rgba(42,26,14,0.08);">
<div style="height:6px;background:%s;"></div>
<div style="padding:32px;">
<h2 style="margin:0 0 12px;">%s</h2>
<p style="margin:0 0 16px;line-height:1.5;">%s</p>
%s
<p style="margin:0;font-size:12px;color:#6B7280;">Tautan persetujuan bersifat idempoten dan hanya dapat digunakan sekali.</p>
</div>
</div>
</body>
</html>`,
		accent,
		html.EscapeString(title),
		html.EscapeString(message),
		statusLine,
	)
}
