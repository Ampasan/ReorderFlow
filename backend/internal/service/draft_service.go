package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"

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
	ErrManagerEmailFailed    = errors.New("email persetujuan ke manajer gagal dikirim")
)

type DraftItem struct {
	SKU         string `json:"sku" binding:"required"`
	JumlahOrder int    `json:"jumlah_order" binding:"required,gt=0"`
}

type UpdateDraftRequest struct {
	Items []DraftItem `json:"items" binding:"required,min=1"`
}

type DraftService struct {
	poRepo   *repository.PORepository
	stokRepo *repository.StokRepository
	storage  *utils.SupabaseStorage
	email    *EmailService
}

func NewDraftService(
	poRepo *repository.PORepository,
	stokRepo *repository.StokRepository,
	storage *utils.SupabaseStorage,
	email *EmailService,
) *DraftService {
	return &DraftService{
		poRepo:   poRepo,
		stokRepo: stokRepo,
		storage:  storage,
		email:    email,
	}
}

func (s *DraftService) Get(id int64) (*model.POLog, error) {
	return s.poRepo.GetByID(id)
}

func (s *DraftService) Update(ctx context.Context, id int64, items []DraftItem) (*model.POLog, error) {
	po, err := s.poRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if po.Status != model.POStatusDraft && po.Status != model.POStatusRejected {
		return nil, ErrPONotDraft
	}

	details, err := s.buildDetails(po.IDPemasok, items)
	if err != nil {
		return nil, err
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
	if po.Status != model.POStatusDraft && po.Status != model.POStatusRejected {
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

	emailCtx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	if err := s.email.SendManagerApproval(emailCtx, POEmailData{
		NomorPO:      po.NomorPO,
		PemasokNama:  po.Pemasok.Nama,
		PemasokEmail: po.Pemasok.Email,
		Token:        token,
		Items:        pdfItems,
		TotalQty:     totalQty,
	}); err != nil {
		utils.Logger.Error("send manager approval failed", "nomor_po", po.NomorPO, "error", err)
		_ = s.poRepo.UpdateStatus(po.ID, model.POStatusManualReview)
		return nil, ErrManagerEmailFailed
	}

	return s.poRepo.GetByID(po.ID)
}

func (s *DraftService) renderPO(
	ctx context.Context,
	po *model.POLog,
	details []model.PODetail,
) (string, []utils.PDFItem, int, error) {
	pdfItems := make([]utils.PDFItem, 0, len(details))
	totalQty := 0
	for _, detail := range details {
		nama := detail.SKU
		if stok, err := s.stokRepo.GetBySKU(detail.SKU); err == nil {
			nama = stok.Nama
		}
		pdfItems = append(pdfItems, utils.PDFItem{
			SKU:    detail.SKU,
			Nama:   nama,
			Jumlah: detail.JumlahOrder,
		})
		totalQty += detail.JumlahOrder
	}

	pemasokNama := ""
	pemasokEmail := ""
	if po.Pemasok != nil {
		pemasokNama = po.Pemasok.Nama
		pemasokEmail = po.Pemasok.Email
	}

	pdfBytes, err := utils.GeneratePO(utils.PODocument{
		NomorPO:      po.NomorPO,
		Tanggal:      time.Now().Format("02/01/2006"),
		PemasokNama:  pemasokNama,
		PemasokEmail: pemasokEmail,
		Items:        pdfItems,
		TotalQty:     totalQty,
	})
	if err != nil {
		return "", nil, 0, fmt.Errorf("%w: %v", ErrDraftPDFFailed, err)
	}

	filename := fmt.Sprintf("PO_%s_%d.pdf", po.NomorPO, time.Now().Unix())
	var pdfURL string
	if err := Retry(ctx, 3, StorageBackoff, func() error {
		url, uploadErr := s.storage.Upload(filename, pdfBytes, "application/pdf")
		if uploadErr != nil {
			return uploadErr
		}
		pdfURL = url
		return nil
	}); err != nil {
		return "", nil, 0, fmt.Errorf("%w: %v", ErrDraftPDFFailed, err)
	}

	return pdfURL, pdfItems, totalQty, nil
}

func (s *DraftService) buildDetails(supplierID int64, items []DraftItem) ([]model.PODetail, error) {
	if len(items) == 0 {
		return nil, ErrDraftEmpty
	}

	seen := make(map[string]struct{}, len(items))
	details := make([]model.PODetail, 0, len(items))

	for _, item := range items {
		sku := strings.TrimSpace(item.SKU)
		if sku == "" || item.JumlahOrder <= 0 {
			return nil, ErrDraftItemInvalid
		}
		if _, duplicate := seen[sku]; duplicate {
			return nil, ErrDraftItemInvalid
		}
		seen[sku] = struct{}{}

		stok, err := s.stokRepo.GetBySKU(sku)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, ErrDraftItemInvalid
			}
			return nil, err
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
