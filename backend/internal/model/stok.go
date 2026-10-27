package model

import "time"

const (
	StockStatusNormal       = "NORMAL"
	StockStatusLowStock     = "LOW_STOCK"
	StockStatusManualReview = "REQUIRES_MANUAL_REVIEW"
)

type Stok struct {
	SKU          string    `gorm:"primaryKey;column:sku;type:varchar(50)" json:"sku"`
	Nama         string    `gorm:"column:nama;type:varchar(150);not null" json:"nama"`
	StokSaatIni  int       `gorm:"column:stok_saat_ini;not null;default:0" json:"stok_saat_ini"`
	ReorderPoint int       `gorm:"column:reorder_point;not null;default:0" json:"reorder_point"`
	QtyMinOrder  int       `gorm:"column:qty_min_order;not null;default:1" json:"qty_min_order"`
	IDPemasok    int64     `gorm:"column:id_pemasok;not null" json:"id_pemasok"`
	UpdatedAt    time.Time `gorm:"column:updated_at" json:"updated_at"`
	Pemasok      *Pemasok  `gorm:"foreignKey:IDPemasok;references:ID" json:"pemasok,omitempty"`
}

func (Stok) TableName() string { return "stok" }

func (s *Stok) Status() string {
	if s.StokSaatIni < 0 || s.ReorderPoint <= 0 || s.QtyMinOrder <= 0 {
		return StockStatusManualReview
	}
	if s.StokSaatIni <= s.ReorderPoint {
		return StockStatusLowStock
	}
	return StockStatusNormal
}
