package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"reorderflow-backend/internal/cache"
	"reorderflow-backend/internal/model"
	"reorderflow-backend/internal/repository"
	"reorderflow-backend/internal/utils"
)

var (
	ErrPONotDraft            = errors.New("PO tidak bisa diubah pada status saat ini")
	ErrDraftEmpty            = errors.New("draf PO harus berisi minimal satu barang")
	ErrDraftItemInvalid      = errors.New("barang draf tidak valid")
	ErrDraftSupplierMismatch = errors.New("barang bukan milik pemasok PO ini")
	ErrSupplierEmailInvalid  = errors.New("email pemasok tidak valid")
	ErrDraftPDFFailed        = errors.New("dokumen PDF draf gagal disiapkan")
	ErrPONotResendable       = errors.New("PO hanya bisa dikirim ulang dari status SENT atau REQUIRES_MANUAL_REVIEW")
)

type DraftItem struct {
	SKU         string `json:"sku" binding:"required"`
	JumlahOrder int    `json:"jumlah_order" binding:"required,gt=0"`
}

type UpdateDraftRequest struct {
	Items []DraftItem `json:"items" binding:"required,min=1"`
}

type DraftService struct {
	poRepo     *repository.PORepository
	stokRepo   *repository.StokRepository
	storage    *utils.SupabaseStorage
	email      *EmailService
	emailQueue *EmailQueue
	cache      *cache.Cache
}

func NewDraftService(
	poRepo *repository.PORepository,
	stokRepo *repository.StokRepository,
	storage *utils.SupabaseStorage,
	email *EmailService,
	emailQueue *EmailQueue,
	cacheStore *cache.Cache,
) *DraftService {
	return &DraftService{
		poRepo:     poRepo,
		stokRepo:   stokRepo,
		storage:    storage,
		email:      email,
		emailQueue: emailQueue,
		cache:      cacheStore,
	}
}

func (s *DraftService) Get(id int64) (*model.POLog, error) {
	return s.poRepo.GetByID(id)
}

func (s *DraftService) RegeneratePDF(ctx context.Context, id int64) (*model.POLog, error) {
	po, err := s.poRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	stockBySKU := loadStockNames(s.stokRepo, detailSKUs(po.Details), po.NomorPO)
	pdfItems, totalQty := pdfItemsFromDetails(po.Details, stockBySKU)

	pdfBytes, err := utils.GeneratePO(newPODocument(
		po,
		pdfItems,
		totalQty,
		po.CreatedAt.Format("02/01/2006"),
		po.Status == model.POStatusSent,
	))
	if err != nil {
		return nil, fmt.Errorf("render PDF gagal: %w", err)
	}

	filename := fmt.Sprintf("PO_%s_regen_%d.pdf", po.NomorPO, time.Now().Unix())
	pdfURL, err := uploadPDF(ctx, s.storage, filename, pdfBytes)
	if err != nil {
		return nil, fmt.Errorf("upload PDF gagal: %w", err)
	}

	if err := s.poRepo.UpdatePDFURL(id, pdfURL); err != nil {
		return nil, err
	}

	s.cache.Invalidate()
	return s.poRepo.GetByID(id)
}

func (s *DraftService) Update(ctx context.Context, id int64, items []DraftItem) (*model.POLog, error) {
	po, err := s.poRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if po.Status != model.POStatusDraft && po.Status != model.POStatusRejected && po.Status != model.POStatusManualReview {
		return nil, ErrPONotDraft
	}

	details, err := s.buildDetails(po.IDPemasok, items)
	if err != nil {
		return nil, err
	}
	recommendations := make(map[string]model.PODetail, len(po.Details))
	for _, detail := range po.Details {
		recommendations[detail.SKU] = detail
	}
	for i := range details {
		if recommendation, exists := recommendations[details[i].SKU]; exists {
			details[i].AIPriority = recommendation.AIPriority
			details[i].AIReason = recommendation.AIReason
		}
	}

	pdfURL, _, _, err := s.renderPO(ctx, po, details)
	if err != nil {
		return nil, err
	}

	updated, err := s.poRepo.ReplaceDraftDetails(po.ID, details, pdfURL)
	if err != nil {
		return nil, err
	}
	if !updated {
		return nil, ErrPONotDraft
	}

	return s.poRepo.GetByID(po.ID)
}

func (s *DraftService) Submit(ctx context.Context, id int64) (*model.POLog, error) {
	po, err := s.poRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if po.Status != model.POStatusDraft && po.Status != model.POStatusRejected && po.Status != model.POStatusManualReview {
		return nil, ErrPONotDraft
	}
	if len(po.Details) == 0 {
		return nil, ErrDraftEmpty
	}
	if po.Pemasok == nil || !isValidEmail(po.Pemasok.Email) {
		return nil, ErrSupplierEmailInvalid
	}

	pdfURL, pdfItems, totalQty, err := s.renderPO(ctx, po, po.Details)
	if err != nil {
		return nil, err
	}

	token, err := utils.GenerateToken()
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrDraftPDFFailed, err)
	}

	submittedAt := time.Now()
	updated, err := s.poRepo.MarkSubmitted(po.ID, pdfURL, token, submittedAt)
	if err != nil {
		return nil, err
	}
	if !updated {
		return nil, ErrPONotDraft
	}

	emailData := POEmailData{
		NomorPO:      po.NomorPO,
		PemasokNama:  po.Pemasok.Nama,
		PemasokEmail: po.Pemasok.Email,
		Token:        token,
		Items:        pdfItems,
		TotalQty:     totalQty,
	}

	s.emailQueue.Enqueue(EmailTask{
		Name: "manager approval " + po.NomorPO,
		Send: func(ctx context.Context) error {
			return s.email.SendManagerApproval(ctx, emailData)
		},
		OnFailure: func(err error) {
			utils.Logger.Error("send manager approval failed", "nomor_po", po.NomorPO, "error", err)
			_ = s.poRepo.UpdateStatus(po.ID, model.POStatusManualReview)
			s.cache.Invalidate()
		},
	})

	return s.poRepo.GetByID(po.ID)
}

func (s *DraftService) renderPO(
	ctx context.Context,
	po *model.POLog,
	details []model.PODetail,
) (string, []utils.PDFItem, int, error) {
	stockBySKU := loadStockNames(s.stokRepo, detailSKUs(details), po.NomorPO)
	pdfItems, totalQty := pdfItemsFromDetails(details, stockBySKU)

	pdfBytes, err := utils.GeneratePO(newPODocument(
		po,
		pdfItems,
		totalQty,
		time.Now().Format("02/01/2006"),
		false,
	))
	if err != nil {
		return "", nil, 0, fmt.Errorf("%w: %v", ErrDraftPDFFailed, err)
	}

	pdfURL, err := uploadPDF(ctx, s.storage, poPDFFilename(po), pdfBytes)
	if err != nil {
		return "", nil, 0, fmt.Errorf("%w: %v", ErrDraftPDFFailed, err)
	}

	return pdfURL, pdfItems, totalQty, nil
}

func (s *DraftService) buildDetails(supplierID int64, items []DraftItem) ([]model.PODetail, error) {
	if len(items) == 0 {
		return nil, ErrDraftEmpty
	}

	seen := make(map[string]struct{}, len(items))
	skus := make([]string, 0, len(items))

	for _, item := range items {
		sku := strings.TrimSpace(item.SKU)
		if sku == "" || item.JumlahOrder <= 0 {
			return nil, ErrDraftItemInvalid
		}
		if _, duplicate := seen[sku]; duplicate {
			return nil, ErrDraftItemInvalid
		}
		seen[sku] = struct{}{}
		skus = append(skus, sku)
	}

	stockBySKU, err := s.stokRepo.GetBySKUs(skus)
	if err != nil {
		return nil, err
	}

	details := make([]model.PODetail, 0, len(skus))
	for _, item := range items {
		sku := strings.TrimSpace(item.SKU)
		stok, exists := stockBySKU[sku]
		if !exists {
			return nil, ErrDraftItemInvalid
		}
		if stok.IDPemasok != supplierID {
			return nil, ErrDraftSupplierMismatch
		}

		details = append(details, model.PODetail{
			SKU:         sku,
			JumlahOrder: item.JumlahOrder,
		})
	}

	return details, nil
}

// ResendSupplier re-queues the supplier email for a PO that is already SENT
// or stuck in MANUAL_REVIEW after a failed email delivery. The approval
// decision is not re-evaluated; the PO is reset to SENT and the email task
// is enqueued again.
func (s *DraftService) ResendSupplier(ctx context.Context, id int64) (*model.POLog, error) {
	po, err := s.poRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if po.Status != model.POStatusSent && po.Status != model.POStatusManualReview {
		return nil, ErrPONotResendable
	}
	if po.Pemasok == nil || !isValidEmail(po.Pemasok.Email) {
		return nil, ErrSupplierEmailInvalid
	}

	// Ensure the status is SENT before re-sending.
	if po.Status == model.POStatusManualReview {
		if err := s.poRepo.UpdateStatus(po.ID, model.POStatusSent); err != nil {
			return nil, err
		}
	}

	emailData := POEmailData{
		NomorPO:      po.NomorPO,
		PemasokNama:  po.Pemasok.Nama,
		PemasokEmail: po.Pemasok.Email,
		TotalQty:     poTotalQty(po.Details),
	}

	s.emailQueue.Enqueue(EmailTask{
		Name: "resend supplier PO " + po.NomorPO,
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
				return fmt.Errorf("%w: %v", ErrDraftPDFFailed, err)
			}
			filename := fmt.Sprintf("PO_%s_resend_%d.pdf", po.NomorPO, time.Now().Unix())
			if pdfURL, uploadErr := uploadPDF(ctx, s.storage, filename, pdfBytes); uploadErr != nil {
				utils.Logger.Warn("upload resend PDF failed", "nomor_po", po.NomorPO, "error", uploadErr)
			} else if updateErr := s.poRepo.UpdatePDFURL(po.ID, pdfURL); updateErr != nil {
				utils.Logger.Warn("update resend PDF URL failed", "nomor_po", po.NomorPO, "error", updateErr)
			}
			if sendErr := s.email.SendSupplierPO(ctx, emailData, po.NomorPO+".pdf", pdfBytes); sendErr != nil {
				return fmt.Errorf("send email: %w", sendErr)
			}
			return nil
		},
		OnFailure: func(err error) {
			// Keep SENT — the approval is already final. Only fall back to
			// MANUAL_REVIEW when the PDF itself cannot be generated.
			utils.Logger.Error("resend supplier PO failed", "nomor_po", po.NomorPO, "error", err)
			if errors.Is(err, ErrDraftPDFFailed) {
				_ = s.poRepo.UpdateStatus(po.ID, model.POStatusManualReview)
			}
			s.cache.Invalidate()
		},
	})

	return s.poRepo.GetByID(po.ID)
}
