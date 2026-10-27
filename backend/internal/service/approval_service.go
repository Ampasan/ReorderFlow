package service

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"

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
	NomorPO string
	Status  string
	Message string
	Used    bool
	Expired bool
}

type ApprovalService struct {
	poRepo  *repository.PORepository
	redis   *repository.RedisRepository
	email   *EmailService
	storage *utils.SupabaseStorage
}

func NewApprovalService(
	poRepo *repository.PORepository,
	redisRepo *repository.RedisRepository,
	email *EmailService,
	storage *utils.SupabaseStorage,
) *ApprovalService {
	return &ApprovalService{
		poRepo:  poRepo,
		redis:   redisRepo,
		email:   email,
		storage: storage,
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

	if time.Since(po.CreatedAt) > tokenTTL {
		_ = s.poRepo.UpdateStatus(po.ID, model.POStatusManualReview)
		return &ApprovalOutcome{
			NomorPO: po.NomorPO,
			Status:  model.POStatusManualReview,
			Message: "Token persetujuan sudah kedaluwarsa. PO ditandai untuk peninjauan manual.",
			Expired: true,
		}, nil
	}

	if po.Status != model.POStatusDraft {
		return &ApprovalOutcome{
			NomorPO: po.NomorPO,
			Status:  po.Status,
			Message: "Tautan persetujuan ini sudah pernah digunakan sebelumnya.",
			Used:    true,
		}, nil
	}

	if action == "reject" {
		updated, err := s.poRepo.UpdateStatusIfDraft(po.ID, model.POStatusRejected)
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

	updated, err := s.poRepo.UpdateStatusIfDraft(po.ID, model.POStatusSent)
	if err != nil {
		return nil, err
	}
	if !updated {
		return s.alreadyUsedOutcome(po.ID)
	}

	pdfBytes, err := s.storage.Download(po.TautanPDF)
	if err != nil {
		_ = s.poRepo.UpdateStatus(po.ID, model.POStatusManualReview)
		return &ApprovalOutcome{
			NomorPO: po.NomorPO,
			Status:  model.POStatusManualReview,
			Message: "Persetujuan diproses, tetapi dokumen PDF gagal diunduh. PO ditandai untuk peninjauan manual.",
		}, nil
	}

	emailData := POEmailData{
		NomorPO:      po.NomorPO,
		PemasokNama:  supplierName(po),
		PemasokEmail: supplierEmail(po),
		TotalQty:     poTotalQty(po.Details),
	}

	if err := s.email.SendSupplierPO(ctx, emailData, po.NomorPO+".pdf", pdfBytes); err != nil {
		_ = s.poRepo.UpdateStatus(po.ID, model.POStatusManualReview)
		return &ApprovalOutcome{
			NomorPO: po.NomorPO,
			Status:  model.POStatusManualReview,
			Message: "Persetujuan diproses, tetapi email ke Pemasok gagal dikirim. PO ditandai untuk peninjauan manual.",
		}, nil
	}

	return &ApprovalOutcome{
		NomorPO: po.NomorPO,
		Status:  model.POStatusSent,
		Message: "Persetujuan PO Berhasil Diproses. Dokumen PDF telah dikirim ke email Pemasok.",
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
