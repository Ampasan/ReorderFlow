package handler

import (
	"errors"
	"fmt"
	"html"
	"net/http"

	"github.com/gin-gonic/gin"

	"reorderflow-backend/internal/cache"
	"reorderflow-backend/internal/service"
	"reorderflow-backend/internal/utils"
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

	if token == "" {
		h.render(c, http.StatusBadRequest, "Tautan Tidak Valid",
			"Token persetujuan tidak ditemukan atau sudah kedaluwarsa.", "", "", "red")
		return
	}
	if action != "approve" && action != "reject" {
		h.render(c, http.StatusBadRequest, "Action Tidak Valid",
			"Parameter action harus approve atau reject.", "", "", "red")
		return
	}

	applyApprovalHeaders(c)
	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(approvalConfirmationPage(token, action)))
}

func (h *ApprovalHandler) Process(c *gin.Context) {
	h.process(c, c.PostForm("token"), c.PostForm("action"))
}

func (h *ApprovalHandler) process(c *gin.Context, token, action string) {
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
			utils.Logger.Error("process PO approval failed", "error", err)
			h.render(c, http.StatusInternalServerError, "Terjadi Kesalahan",
				"Gagal memproses persetujuan. Silakan coba lagi.", "", "", "red")
		}
		return
	}

	h.cache.Invalidate()

	switch {
	case outcome.Expired:
		h.render(c, http.StatusOK, "Tautan Kedaluwarsa", outcome.Message, outcome.NomorPO, outcome.Status, "red")
	case outcome.NotSubmitted:
		h.render(c, http.StatusOK, "Belum Diajukan", outcome.Message, outcome.NomorPO, outcome.Status, "amber")
	case outcome.Used:
		h.render(c, http.StatusOK, "Tautan Sudah Digunakan", outcome.Message, outcome.NomorPO, outcome.Status, "amber")
	default:
		h.render(c, http.StatusOK, "Persetujuan Berhasil", outcome.Message, outcome.NomorPO, outcome.Status, "green")
	}
}

func (h *ApprovalHandler) render(c *gin.Context, status int, title, message, nomorPO, poStatus, color string) {
	applyApprovalHeaders(c)
	c.Data(status, "text/html; charset=utf-8", []byte(approvalPage(title, message, nomorPO, poStatus, color)))
}

func applyApprovalHeaders(c *gin.Context) {
	c.Header("Cache-Control", "no-store")
	c.Header("X-Robots-Tag", "noindex, nofollow")
	c.Header("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'")
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

func approvalConfirmationPage(token, action string) string {
	label := "Setujui PO"
	accent := "#047857"
	if action == "reject" {
		label = "Tolak PO"
		accent = "#BE123C"
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>Konfirmasi Persetujuan PO ReorderFlow</title>
</head>
<body style="margin:0;padding:40px 16px;background:#FEF3E2;font-family:Arial,Helvetica,sans-serif;color:#2A1A0E;">
<main style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #EAD8C0;border-radius:16px;padding:32px;">
<h1 style="margin:0 0 12px;font-size:24px;">Konfirmasi keputusan PO</h1>
<p style="margin:0 0 24px;line-height:1.5;">Tautan ini belum mengubah status PO. Konfirmasi keputusan Anda untuk melanjutkan.</p>
<form method="post" action="/api/po/approval">
<input type="hidden" name="token" value="%s">
<input type="hidden" name="action" value="%s">
<button type="submit" style="min-height:44px;border:0;border-radius:8px;background:%s;color:#ffffff;padding:12px 20px;font-size:16px;font-weight:600;cursor:pointer;">%s</button>
</form>
</main>
</body>
</html>`,
		html.EscapeString(token),
		html.EscapeString(action),
		accent,
		html.EscapeString(label),
	)
}
