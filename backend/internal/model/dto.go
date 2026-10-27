package model

import "time"

type ScanResult struct {
	ScannedItems    int `json:"scanned_items"`
	LowStockCount   int `json:"low_stock_count"`
	DraftPOCreated  int `json:"draft_po_created"`
	SkippedActivePO int `json:"skipped_active_po"`
	ManualReview    int `json:"manual_review"`
}

type StockItem struct {
	SKU          string    `json:"sku"`
	Nama         string    `json:"nama"`
	StokSaatIni  int       `json:"stok_saat_ini"`
	ReorderPoint int       `json:"reorder_point"`
	QtyMinOrder  int       `json:"qty_min_order"`
	IDPemasok    int64     `json:"id_pemasok"`
	UpdatedAt    time.Time `json:"updated_at"`
	Pemasok      *Pemasok  `json:"pemasok,omitempty"`
	Status       string    `json:"status"`
}

func NewStockItem(s Stok) StockItem {
	return StockItem{
		SKU:          s.SKU,
		Nama:         s.Nama,
		StokSaatIni:  s.StokSaatIni,
		ReorderPoint: s.ReorderPoint,
		QtyMinOrder:  s.QtyMinOrder,
		IDPemasok:    s.IDPemasok,
		UpdatedAt:    s.UpdatedAt,
		Pemasok:      s.Pemasok,
		Status:       s.Status(),
	}
}

type DashboardSummary struct {
	TotalSKU        int64 `json:"total_sku"`
	LowStockCount   int64 `json:"low_stock_count"`
	ManualReview    int64 `json:"manual_review"`
	PendingPOCount  int64 `json:"pending_po_count"`
	SentPOCount     int64 `json:"sent_po_count"`
	RejectedPOCount int64 `json:"rejected_po_count"`
}

type ApprovalResult struct {
	Token       string `json:"token"`
	NomorPO     string `json:"nomor_po"`
	Status      string `json:"status"`
	Message     string `json:"message"`
	AlreadyUsed bool   `json:"already_used"`
}
