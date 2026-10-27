package job

import (
	"context"
	"time"

	"reorderflow-backend/internal/service"
	"reorderflow-backend/internal/utils"
)

type LowStockJob struct {
	detection *service.DetectionService
}

func NewLowStockJob(detection *service.DetectionService) *LowStockJob {
	return &LowStockJob{detection: detection}
}

func (j *LowStockJob) Run() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	result, err := j.detection.RunScan(ctx)
	if err != nil {
		utils.Logger.Error("scheduled low-stock scan failed", "error", err)
		return
	}

	utils.Logger.Info("scheduled low-stock scan completed",
		"scanned_items", result.ScannedItems,
		"low_stock_count", result.LowStockCount,
		"draft_po_created", result.DraftPOCreated,
		"skipped_active_po", result.SkippedActivePO,
		"manual_review", result.ManualReview,
	)
}
