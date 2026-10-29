package service

import (
	"context"
	"fmt"
	"html"
	"strings"

	"reorderflow-backend/internal/utils"
)

type POEmailData struct {
	NomorPO      string
	PemasokNama  string
	PemasokEmail string
	Token        string
	Items        []utils.PDFItem
	TotalQty     int
}

type EmailService struct {
	sender *utils.EmailSender
	cfg    utils.SMTPConfig
	appURL string
}

func NewEmailService(sender *utils.EmailSender, cfg utils.SMTPConfig, appURL string) *EmailService {
	return &EmailService{
		sender: sender,
		cfg:    cfg,
		appURL: strings.TrimRight(appURL, "/"),
	}
}

func (s *EmailService) SendManagerApproval(ctx context.Context, data POEmailData) error {
	if strings.TrimSpace(s.cfg.ManagerEmail) == "" {
		return fmt.Errorf("MANAGER_EMAIL belum diatur")
	}

	subject := fmt.Sprintf("[Action Required] Persetujuan PO #%s - %s", data.NomorPO, data.PemasokNama)
	approveURL := fmt.Sprintf("%s/api/po/approval?token=%s&action=approve", s.appURL, data.Token)
	rejectURL := fmt.Sprintf("%s/api/po/approval?token=%s&action=reject", s.appURL, data.Token)
	body := s.managerBody(data, approveURL, rejectURL)

	return Retry(ctx, 1, SMTPStorageBackoff, func() error {
		return s.sender.Send(s.cfg.ManagerEmail, subject, body)
	})
}

func (s *EmailService) SendSupplierPO(ctx context.Context, data POEmailData, filename string, pdfBytes []byte) error {
	subject := fmt.Sprintf("Purchase Order #%s - ReorderFlow", data.NomorPO)
	body := s.supplierBody(data)

	return Retry(ctx, 1, SMTPStorageBackoff, func() error {
		return s.sender.SendWithAttachment(data.PemasokEmail, subject, body, filename, pdfBytes)
	})
}

func (s *EmailService) SendInvalidSupplierNotice(ctx context.Context, nomorPO, supplierName string) error {
	if strings.TrimSpace(s.cfg.ManagerEmail) == "" {
		return fmt.Errorf("MANAGER_EMAIL belum diatur")
	}

	subject := fmt.Sprintf("[Perhatian] Email Pemasok Tidak Valid untuk PO #%s", nomorPO)
	body := fmt.Sprintf(`<!DOCTYPE html>
<html><body style="font-family:Arial,Helvetica,sans-serif;color:#2A1A0E;padding:24px;">
<p>Pemasok <strong>%s</strong> pada PO <strong>#%s</strong> tidak memiliki alamat email valid.</p>
<p>PO ditandai sebagai REQUIRES_MANUAL_REVIEW. Periksa data pemasok lalu proses ulang secara manual.</p>
</body></html>`, html.EscapeString(supplierName), html.EscapeString(nomorPO))

	return Retry(ctx, 1, SMTPStorageBackoff, func() error {
		return s.sender.Send(s.cfg.ManagerEmail, subject, body)
	})
}

func (s *EmailService) managerBody(data POEmailData, approveURL, rejectURL string) string {
	var rows strings.Builder
	for _, item := range data.Items {
		fmt.Fprintf(&rows, `<tr>
<td style="padding:8px;border-bottom:1px solid #EAD8C0;">%s</td>
<td style="padding:8px;border-bottom:1px solid #EAD8C0;">%s</td>
<td style="padding:8px;border-bottom:1px solid #EAD8C0;text-align:center;">%d</td>
</tr>`, html.EscapeString(item.SKU), html.EscapeString(item.Nama), item.Jumlah)
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#FEF3E2;font-family:Arial,Helvetica,sans-serif;color:#2A1A0E;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #EAD8C0;border-radius:12px;padding:24px;">
<h2 style="margin:0 0 12px;">Persetujuan Purchase Order</h2>
<p style="margin:0 0 12px;">Draft PO <strong>#%s</strong> dari <strong>%s</strong> siap ditinjau.</p>
<table style="width:100%%;border-collapse:collapse;margin-bottom:16px;">
<thead><tr>
<th style="text-align:left;padding:8px;border-bottom:1px solid #EAD8C0;">SKU</th>
<th style="text-align:left;padding:8px;border-bottom:1px solid #EAD8C0;">Nama Barang</th>
<th style="text-align:center;padding:8px;border-bottom:1px solid #EAD8C0;">Qty</th>
</tr></thead>
<tbody>%s</tbody>
</table>
<p style="margin:0 0 16px;">Total qty: <strong>%d</strong></p>
<p style="margin:0 0 24px;">
<a href="%s" style="display:inline-block;background:#047857;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;margin-right:12px;">Approve</a>
<a href="%s" style="display:inline-block;background:#BE123C;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;">Reject</a>
</p>
<p style="margin:0;font-size:12px;color:#6B7280;">Tautan berlaku sekali dan kedaluwarsa dalam 48 jam.</p>
</div>
</body></html>`,
		html.EscapeString(data.NomorPO),
		html.EscapeString(data.PemasokNama),
		rows.String(),
		data.TotalQty,
		approveURL,
		rejectURL,
	)
}

func (s *EmailService) supplierBody(data POEmailData) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html><body style="font-family:Arial,Helvetica,sans-serif;color:#2A1A0E;padding:24px;">
<p>Kepada <strong>%s</strong>,</p>
<p>Terlampir Purchase Order <strong>#%s</strong> dari ReorderFlow.</p>
<p>Total qty: <strong>%d</strong>. Silakan tinjau dokumen PDF terlampir.</p>
</body></html>`,
		html.EscapeString(data.PemasokNama),
		html.EscapeString(data.NomorPO),
		data.TotalQty,
	)
}
