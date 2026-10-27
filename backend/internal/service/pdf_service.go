package service

import (
	"context"
	"fmt"
	"net/mail"
	"sort"
	"strconv"
	"strings"
	"sync/atomic"
	"time"

	"golang.org/x/sync/errgroup"

	"reorderflow-backend/internal/model"
	"reorderflow-backend/internal/repository"
	"reorderflow-backend/internal/utils"
)

const maxConcurrentPOs = 5

type PDFService struct {
	poRepo      *repository.PORepository
	pemasokRepo *repository.PemasokRepository
	storage     *utils.SupabaseStorage
	email       *EmailService
}

func NewPDFService(
	poRepo *repository.PORepository,
	pemasokRepo *repository.PemasokRepository,
	storage *utils.SupabaseStorage,
	email *EmailService,
) *PDFService {
	return &PDFService{
		poRepo:      poRepo,
		pemasokRepo: pemasokRepo,
		storage:     storage,
		email:       email,
	}
}

func (s *PDFService) CreateDraftPOs(ctx context.Context, items []model.Stok) (int, error) {
	groups := groupBySupplier(items)
	keys := sortedSupplierIDs(groups)

	var created int64
	g, gctx := errgroup.WithContext(ctx)
	g.SetLimit(maxConcurrentPOs)

	for _, supplierID := range keys {
		group := groups[supplierID]
		g.Go(func() error {
			if s.createSupplierPO(gctx, supplierID, group) {
				atomic.AddInt64(&created, 1)
			}
			return nil
		})
	}

	_ = g.Wait()

	return int(atomic.LoadInt64(&created)), nil
}

func (s *PDFService) createSupplierPO(ctx context.Context, supplierID int64, group []model.Stok) bool {
	pemasok, err := s.pemasokRepo.GetByID(supplierID)
	if err != nil {
		utils.Logger.Error("supplier not found while building PO", "id_pemasok", supplierID, "error", err)
		return false
	}

	nomor, err := s.nextPONumber(supplierID)
	if err != nil {
		utils.Logger.Error("generate PO number failed", "id_pemasok", supplierID, "error", err)
		return false
	}

	pdfItems := make([]utils.PDFItem, 0, len(group))
	details := make([]model.PODetail, 0, len(group))
	totalQty := 0
	for _, stok := range group {
		qty := stok.QtyMinOrder
		pdfItems = append(pdfItems, utils.PDFItem{SKU: stok.SKU, Nama: stok.Nama, Jumlah: qty})
		details = append(details, model.PODetail{SKU: stok.SKU, JumlahOrder: qty})
		totalQty += qty
	}

	doc := utils.PODocument{
		NomorPO:      nomor,
		Tanggal:      time.Now().Format("02/01/2006"),
		PemasokNama:  pemasok.Nama,
		PemasokEmail: pemasok.Email,
		Items:        pdfItems,
		TotalQty:     totalQty,
	}

	pdfBytes, err := utils.GeneratePO(doc)
	if err != nil {
		utils.Logger.Error("render PDF failed", "nomor_po", nomor, "error", err)
		return false
	}

	filename := fmt.Sprintf("PO_%s_%d.pdf", nomor, time.Now().Unix())
	var publicURL string
	if err := Retry(ctx, 3, StorageBackoff, func() error {
		url, uploadErr := s.storage.Upload(filename, pdfBytes, "application/pdf")
		if uploadErr != nil {
			return uploadErr
		}
		publicURL = url
		return nil
	}); err != nil {
		utils.Logger.Error("upload PDF failed", "nomor_po", nomor, "error", err)
		return false
	}

	token, err := utils.GenerateToken()
	if err != nil {
		utils.Logger.Error("generate token failed", "nomor_po", nomor, "error", err)
		return false
	}

	status := model.POStatusDraft
	if !isValidEmail(pemasok.Email) {
		status = model.POStatusManualReview
	}

	po := &model.POLog{
		NomorPO:   nomor,
		IDPemasok: supplierID,
		Status:    status,
		TautanPDF: publicURL,
		Token:     token,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.createWithRetry(po, details); err != nil {
		utils.Logger.Error("persist PO failed", "nomor_po", nomor, "error", err)
		return false
	}

	s.dispatchEmail(pemasok, nomor, token, pdfItems, totalQty, status)
	return true
}

func (s *PDFService) dispatchEmail(pemasok *model.Pemasok, nomor, token string, items []utils.PDFItem, totalQty int, status string) {
	data := POEmailData{
		NomorPO:      nomor,
		PemasokNama:  pemasok.Nama,
		PemasokEmail: pemasok.Email,
		Token:        token,
		Items:        items,
		TotalQty:     totalQty,
	}

	go func() {
		defer func() {
			if r := recover(); r != nil {
				utils.Logger.Error("email dispatch panic", "nomor_po", nomor, "error", r)
			}
		}()

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		if status == model.POStatusManualReview {
			if err := s.email.SendInvalidSupplierNotice(ctx, nomor, pemasok.Nama); err != nil {
				utils.Logger.Error("send invalid supplier notice failed", "nomor_po", nomor, "error", err)
			}
			return
		}

		if err := s.email.SendManagerApproval(ctx, data); err != nil {
			utils.Logger.Error("send manager approval email failed", "nomor_po", nomor, "error", err)
		}
	}()
}

func (s *PDFService) nextPONumber(supplierID int64) (string, error) {
	date := time.Now().Format("20060102")
	prefix := fmt.Sprintf("PO-%s-%d-", date, supplierID)

	latest, err := s.poRepo.GetLatestPONumber(prefix)
	if err != nil {
		return "", err
	}

	seq := 1
	if latest != "" && len(latest) >= 3 {
		if n, err := strconv.Atoi(latest[len(latest)-3:]); err == nil {
			seq = n + 1
		}
	}

	return fmt.Sprintf("%s%03d", prefix, seq), nil
}

func (s *PDFService) createWithRetry(po *model.POLog, details []model.PODetail) error {
	for attempt := 0; attempt < 5; attempt++ {
		if err := s.poRepo.Create(po, details); err != nil {
			if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
				po.NomorPO = incrementSequence(po.NomorPO)
				continue
			}
			return err
		}
		return nil
	}
	return fmt.Errorf("failed to persist PO after duplicate retries: %s", po.NomorPO)
}

func groupBySupplier(items []model.Stok) map[int64][]model.Stok {
	groups := make(map[int64][]model.Stok)
	for _, item := range items {
		groups[item.IDPemasok] = append(groups[item.IDPemasok], item)
	}
	return groups
}

func sortedSupplierIDs(groups map[int64][]model.Stok) []int64 {
	keys := make([]int64, 0, len(groups))
	for supplierID := range groups {
		keys = append(keys, supplierID)
	}
	sort.Slice(keys, func(i, j int) bool { return keys[i] < keys[j] })
	return keys
}

func isValidEmail(email string) bool {
	if strings.TrimSpace(email) == "" {
		return false
	}
	_, err := mail.ParseAddress(email)
	return err == nil
}

func incrementSequence(nomor string) string {
	if len(nomor) < 3 {
		return nomor
	}
	prefix := nomor[:len(nomor)-3]
	seq, err := strconv.Atoi(nomor[len(nomor)-3:])
	if err != nil {
		return nomor
	}
	return fmt.Sprintf("%s%03d", prefix, seq+1)
}
