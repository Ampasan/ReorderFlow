package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"

	"reorderflow-backend/internal/cache"
	"reorderflow-backend/internal/model"
	"reorderflow-backend/internal/repository"
	"reorderflow-backend/internal/utils"
)

var (
	ErrTokenNotFound = errors.New("token persetujuan tidak valid")
	ErrInvalidAction = errors.New("action persetujuan tidak valid")
)

const tokenTTL = 48 * time.Hour

type ApprovalOutcome struct {
	NomorPO      string
	Status       string
	Message      string
	Used         bool
	Expired      bool
	NotSubmitted bool
}

type ApprovalService struct {
	poRepo     *repository.PORepository
	stokRepo   *repository.StokRepository
	redis      *repository.RedisRepository
	email      *EmailService
	storage    *utils.SupabaseStorage
	emailQueue *EmailQueue
	cache      *cache.Cache
}

func NewApprovalService(
	poRepo *repository.PORepository,
	stokRepo *repository.StokRepository,
	redisRepo *repository.RedisRepository,
	email *EmailService,
	storage *utils.SupabaseStorage,
	emailQueue *EmailQueue,
	cacheStore *cache.Cache,
) *ApprovalService {
	return &ApprovalService{
		poRepo:     poRepo,
		stokRepo:   stokRepo,
		redis:      redisRepo,
		email:      email,
		storage:    storage,
		emailQueue: emailQueue,
		cache:      cacheStore,
	}
}

func (s *ApprovalService) ProcessApproval(ctx context.Context, token, action string) (*ApprovalOutcome, error) {
	if action != "approve" && action != "reject" {
		return nil, ErrInvalidAction
	}

	unlock := s.acquireLock(token)
	defer unlock()

	po, err := s.poRepo.GetByToken(token)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTokenNotFound
		}
		return nil, err
	}

	if po.Status == model.POStatusDraft {
		return &ApprovalOutcome{
			NomorPO:      po.NomorPO,
			Status:       po.Status,
			Message:      "PO masih berstatus draf dan belum diajukan ke manajer.",
			NotSubmitted: true,
		}, nil
	}

	if po.Status != model.POStatusPendingApproval {
		return &ApprovalOutcome{
			NomorPO: po.NomorPO,
			Status:  po.Status,
			Message: "Tautan persetujuan ini sudah pernah digunakan sebelumnya.",
			Used:    true,
		}, nil
	}

	submittedAt := po.CreatedAt
	if po.SubmittedAt != nil {
		submittedAt = *po.SubmittedAt
	}

	if time.Since(submittedAt) > tokenTTL {
		_ = s.poRepo.UpdateStatus(po.ID, model.POStatusManualReview)
		return &ApprovalOutcome{
			NomorPO: po.NomorPO,
			Status:  model.POStatusManualReview,
			Message: "Token persetujuan sudah kedaluwarsa. PO ditandai untuk peninjauan manual.",
			Expired: true,
		}, nil
	}

	if action == "reject" {
		updated, err := s.poRepo.UpdateStatusIfPending(po.ID, model.POStatusRejected)
		if err != nil {
			return nil, err
		}
		if !updated {
			return s.alreadyUsedOutcome(po.ID)
		}
		return &ApprovalOutcome{
			NomorPO: po.NomorPO,
			Status:  model.POStatusRejected,
			Message: "Purchase Order ditolak. Pengiriman ke Pemasok dibatalkan.",
		}, nil
	}

	updated, err := s.poRepo.UpdateStatusIfPending(po.ID, model.POStatusSent)
	if err != nil {
		return nil, err
	}
	if !updated {
		return s.alreadyUsedOutcome(po.ID)
	}

	emailData := POEmailData{
		NomorPO:      po.NomorPO,
		PemasokNama:  supplierName(po),
		PemasokEmail: supplierEmail(po),
		TotalQty:     poTotalQty(po.Details),
	}

	s.emailQueue.Enqueue(EmailTask{
		Name: "supplier PO " + po.NomorPO,
		Send: func(ctx context.Context) error {
			defer s.cache.Invalidate()
			pdfBytes, err := s.renderSupplierPDF(po)
			if err != nil {
				return err
			}
			if pdfURL, uploadErr := s.uploadSupplierPDF(ctx, pdfBytes, po.NomorPO); uploadErr != nil {
				utils.Logger.Warn("upload supplier PDF failed", "nomor_po", po.NomorPO, "error", uploadErr)
			} else if err := s.poRepo.UpdatePDFURL(po.ID, pdfURL); err != nil {
				utils.Logger.Warn("update supplier PDF URL failed", "nomor_po", po.NomorPO, "error", err)
			}
			return s.email.SendSupplierPO(ctx, emailData, po.NomorPO+".pdf", pdfBytes)
		},
		OnFailure: func(err error) {
			utils.Logger.Error("send supplier PO failed", "nomor_po", po.NomorPO, "error", err)
			_ = s.poRepo.UpdateStatus(po.ID, model.POStatusManualReview)
			s.cache.Invalidate()
		},
	})

	return &ApprovalOutcome{
		NomorPO: po.NomorPO,
		Status:  model.POStatusSent,
		Message: "Persetujuan PO berhasil diproses. Email ke pemasok sedang dikirim.",
	}, nil
}

func (s *ApprovalService) acquireLock(token string) func() {
	lockKey := "token:" + token
	locked, err := s.redis.TryLock(lockKey, time.Minute)
	if err != nil {
		utils.Logger.Warn("approval lock unavailable, relying on DB idempotency", "error", err)
		return func() {}
	}
	if !locked {
		return func() {}
	}
	return func() { s.redis.Unlock(lockKey) }
}

func (s *ApprovalService) alreadyUsedOutcome(poID int64) (*ApprovalOutcome, error) {
	current, err := s.poRepo.GetByID(poID)
	if err != nil {
		return nil, err
	}
	return &ApprovalOutcome{
		NomorPO: current.NomorPO,
		Status:  current.Status,
		Message: "Tautan persetujuan ini sudah pernah digunakan sebelumnya.",
		Used:    true,
	}, nil
}

func (s *ApprovalService) renderSupplierPDF(po *model.POLog) ([]byte, error) {
	skus := make([]string, 0, len(po.Details))
	for _, detail := range po.Details {
		skus = append(skus, detail.SKU)
	}

	stockBySKU, err := s.stokRepo.GetBySKUs(skus)
	if err != nil {
		utils.Logger.Warn("stock lookup failed while rendering supplier PO", "nomor_po", po.NomorPO, "error", err)
	}

	items := make([]utils.PDFItem, 0, len(po.Details))
	for _, detail := range po.Details {
		nama := detail.SKU
		if stok, ok := stockBySKU[detail.SKU]; ok {
			nama = stok.Nama
		}
		items = append(items, utils.PDFItem{
			SKU:    detail.SKU,
			Nama:   nama,
			Jumlah: detail.JumlahOrder,
		})
	}

	return utils.GeneratePO(utils.PODocument{
		NomorPO:      po.NomorPO,
		Tanggal:      time.Now().Format("02/01/2006"),
		PemasokNama:  supplierName(po),
		PemasokEmail: supplierEmail(po),
		Items:        items,
		TotalQty:     poTotalQty(po.Details),
		Final:        true,
	})
}

func (s *ApprovalService) uploadSupplierPDF(ctx context.Context, pdfBytes []byte, nomorPO string) (string, error) {
	filename := fmt.Sprintf("PO_%s_final_%d.pdf", nomorPO, time.Now().Unix())
	var publicURL string
	err := Retry(ctx, 3, StorageBackoff, func() error {
		url, uploadErr := s.storage.Upload(filename, pdfBytes, "application/pdf")
		if uploadErr != nil {
			return uploadErr
		}
		publicURL = url
		return nil
	})
	if err != nil {
		return "", err
	}
	return publicURL, nil
}

func supplierName(po *model.POLog) string {
	if po.Pemasok != nil {
		return po.Pemasok.Nama
	}
	return ""
}

func supplierEmail(po *model.POLog) string {
	if po.Pemasok != nil {
		return po.Pemasok.Email
	}
	return ""
}

func poTotalQty(details []model.PODetail) int {
	total := 0
	for _, d := range details {
		total += d.JumlahOrder
	}
	return total
}
