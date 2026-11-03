package service

import (
	"context"
	"fmt"
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
	body := managerApprovalBody(data, approveURL, rejectURL)

	return Retry(ctx, 1, SMTPStorageBackoff, func() error {
		return s.sender.Send(s.cfg.ManagerEmail, subject, body)
	})
}

func (s *EmailService) SendSupplierPO(ctx context.Context, data POEmailData, filename string, pdfBytes []byte) error {
	subject := fmt.Sprintf("Purchase Order #%s - Mitra Sembako", data.NomorPO)
	body := supplierPOBody(data)

	return Retry(ctx, 1, SMTPStorageBackoff, func() error {
		return s.sender.SendWithAttachment(data.PemasokEmail, subject, body, filename, pdfBytes)
	})
}

func (s *EmailService) SendInvalidSupplierNotice(ctx context.Context, nomorPO, supplierName string) error {
	if strings.TrimSpace(s.cfg.ManagerEmail) == "" {
		return fmt.Errorf("MANAGER_EMAIL belum diatur")
	}

	subject := fmt.Sprintf("[Perhatian] Email Pemasok Tidak Valid untuk PO #%s", nomorPO)
	body := invalidSupplierBody(nomorPO, supplierName)

	return Retry(ctx, 1, SMTPStorageBackoff, func() error {
		return s.sender.Send(s.cfg.ManagerEmail, subject, body)
	})
}
