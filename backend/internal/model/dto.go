package model

import "time"

const (
	AIRecommendationAvailable     = "available"
	AIRecommendationUnavailable   = "unavailable"
	AIRecommendationNotConfigured = "not_configured"
	AIRecommendationNotNeeded     = "not_needed"
)

type ScanResult struct {
	ScannedItems           int    `json:"scanned_items"`
	LowStockCount          int    `json:"low_stock_count"`
	DraftPOCreated         int    `json:"draft_po_created"`
	SkippedActivePO        int    `json:"skipped_active_po"`
	ManualReview           int    `json:"manual_review"`
	AIRecommendationStatus string `json:"ai_recommendation_status"`
}

type StockAnalysisItem struct {
	SKU          string `json:"sku"`
	Nama         string `json:"nama"`
	StokSaatIni  int    `json:"stok_saat_ini"`
	ReorderPoint int    `json:"reorder_point"`
	Prioritas    string `json:"prioritas"`
	Alasan       string `json:"alasan"`
}

type StockAnalysis struct {
	ItemCount   int                 `json:"item_count"`
	Explanation string              `json:"explanation"`
	Items       []StockAnalysisItem `json:"items"`
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
	TotalSKU                 int64 `json:"total_sku"`
	LowStockCount            int64 `json:"low_stock_count"`
	ManualReview             int64 `json:"manual_review"`
	DraftPOCount             int64 `json:"draft_po_count"`
	PendingPOCount           int64 `json:"pending_po_count"`
	SentPOCount              int64 `json:"sent_po_count"`
	RejectedPOCount          int64 `json:"rejected_po_count"`
	PartiallyReceivedPOCount int64 `json:"partially_received_po_count"`
	ReceivedPOCount          int64 `json:"received_po_count"`
}

type StockOpnameRequest struct {
	StokSaatIni *int   `json:"stok_saat_ini" binding:"required,gte=0"`
	Alasan      string `json:"alasan" binding:"required,oneof=DAMAGED MISCOUNT RETURN"`
}

type PenerimaanItemRequest struct {
	SKU         string `json:"sku" binding:"required"`
	QtyDiterima int    `json:"qty_diterima" binding:"gte=0"`
}

type CatatPenerimaanRequest struct {
	Items []PenerimaanItemRequest `json:"items" binding:"required,min=1,dive"`
}

type PenerimaanItemView struct {
	SKU           string `json:"sku"`
	Nama          string `json:"nama"`
	JumlahOrder   int    `json:"jumlah_order"`
	SudahDiterima int    `json:"sudah_diterima"`
	Sisa          int    `json:"sisa"`
}

type PenerimaanRiwayatItemView struct {
	SKU         string `json:"sku"`
	Nama        string `json:"nama"`
	QtyDiterima int    `json:"qty_diterima"`
}

type PenerimaanRiwayatView struct {
	ID        int64                       `json:"id"`
	CreatedAt time.Time                   `json:"created_at"`
	Items     []PenerimaanRiwayatItemView `json:"items"`
}

type PenerimaanView struct {
	POID    int64                   `json:"po_id"`
	NomorPO string                  `json:"nomor_po"`
	Status  string                  `json:"status"`
	Items   []PenerimaanItemView    `json:"items"`
	Riwayat []PenerimaanRiwayatView `json:"riwayat"`
}
