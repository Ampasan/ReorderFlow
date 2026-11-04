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
			stockBySKU := loadStockNames(s.stokRepo, detailSKUs(po.Details), po.NomorPO)
			items, totalQty := pdfItemsFromDetails(po.Details, stockBySKU)
			pdfBytes, err := utils.GeneratePO(newPODocument(
				po,
				items,
				totalQty,
				time.Now().Format("02/01/2006"),
				true,
			))
			if err != nil {
				return err
			}
			filename := fmt.Sprintf("PO_%s_final_%d.pdf", po.NomorPO, time.Now().Unix())
			if pdfURL, uploadErr := uploadPDF(ctx, s.storage, filename, pdfBytes); uploadErr != nil {
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
