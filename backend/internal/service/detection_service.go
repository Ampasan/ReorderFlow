package service

import (
	"context"
	"errors"
	"sync/atomic"
	"time"

	"reorderflow-backend/internal/model"
	"reorderflow-backend/internal/repository"
	"reorderflow-backend/internal/utils"
)

var ErrScanInProgress = errors.New("pemindaian sedang berlangsung")

const (
	scanLockKey = "lock:scan:active"
	scanLockTTL = 5 * time.Minute
)

type DetectionService struct {
	stokRepo *repository.StokRepository
	poRepo   *repository.PORepository
	redis    *repository.RedisRepository
	pdf      *PDFService
	stockAI  *StockAIService
	scanLock atomic.Bool
}

func NewDetectionService(
	stokRepo *repository.StokRepository,
	poRepo *repository.PORepository,
	redisRepo *repository.RedisRepository,
	pdf *PDFService,
	stockAI *StockAIService,
) *DetectionService {
	return &DetectionService{
		stokRepo: stokRepo,
		poRepo:   poRepo,
		redis:    redisRepo,
		pdf:      pdf,
		stockAI:  stockAI,
	}
}

func (s *DetectionService) RunScan(ctx context.Context) (*model.ScanResult, error) {
	unlock, locked := s.acquireScanLock()
	if !locked {
		return nil, ErrScanInProgress
	}
	defer unlock()

	utils.Logger.Info("Executing Low-Stock Scanner...")

	var total int64
	var items []model.Stok
	if err := Retry(ctx, 3, DatabaseBackoff, func() error {
		n, countErr := s.stokRepo.Count()
		if countErr != nil {
			return countErr
		}
		list, listErr := s.stokRepo.GetLowStockItems()
		if listErr != nil {
			return listErr
		}
		total = n
		items = list
		return nil
	}); err != nil {
		return nil, err
	}

	result := &model.ScanResult{ScannedItems: int(total)}
	result.AIRecommendationStatus = model.AIRecommendationNotNeeded

	if len(items) == 0 {
		utils.Logger.Info("No low-stock items detected")
		return result, nil
	}

	utils.Logger.Info("Found low-stock items", "count", len(items))

	activeSKUs, activeSuppliers, activeErr := s.poRepo.GetActiveReferences(time.Now().Add(-7 * 24 * time.Hour))
	if activeErr != nil {
		utils.Logger.Error("active PO batch lookup failed, defaulting to active to prevent duplicates", "error", activeErr)
	}

	valid := make([]model.Stok, 0, len(items))
	for _, item := range items {
		if item.Status() == model.StockStatusManualReview {
			result.ManualReview++
			utils.Logger.Warn("abnormal stock data marked for manual review", "sku", item.SKU)
			continue
		}

		result.LowStockCount++

		if activeErr != nil {
			result.SkippedActivePO++
			continue
		}
		if _, ok := activeSKUs[item.SKU]; ok {
			result.SkippedActivePO++
			utils.Logger.Info("SKU skipped: active PO exists", "sku", item.SKU)
			continue
		}
		if _, ok := activeSuppliers[item.IDPemasok]; ok {
			result.SkippedActivePO++
			utils.Logger.Info("SKU skipped: supplier has active PO", "sku", item.SKU, "id_pemasok", item.IDPemasok)
			continue
		}

		valid = append(valid, item)
	}

	if len(valid) == 0 {
		utils.Logger.Info("No low-stock items require reorder")
		return result, nil
	}

	recommendations := map[string]model.StockRecommendation{}
	result.AIRecommendationStatus = model.AIRecommendationNotConfigured
	if s.stockAI != nil {
		result.AIRecommendationStatus = model.AIRecommendationUnavailable
		var recommendationErr error
		recommendations, recommendationErr = s.stockAI.PrioritizeLowStock(ctx, valid)
		if recommendationErr != nil {
			utils.Logger.Warn("Gemini stock prioritization failed; continuing with standard draft quantities", "error", recommendationErr)
		} else {
			result.AIRecommendationStatus = model.AIRecommendationAvailable
		}
	}

	created, err := s.pdf.CreateDraftPOs(ctx, valid, recommendations)
	if err != nil {
		return nil, err
	}
	result.DraftPOCreated = created

	return result, nil
}

func (s *DetectionService) acquireScanLock() (func(), bool) {
	if s.redis.Enabled() {
		locked, err := s.redis.TryLock(scanLockKey, scanLockTTL)
		if err == nil {
			if !locked {
				return nil, false
			}
			return func() { s.redis.Unlock(scanLockKey) }, true
		}
		utils.Logger.Warn("redis scan lock unavailable, using process-local lock", "error", err)
	}

	if !s.scanLock.CompareAndSwap(false, true) {
		return nil, false
	}
	return func() { s.scanLock.Store(false) }, true
}
