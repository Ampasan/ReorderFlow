package model

import "time"

const (
	OpnameReasonDamaged  = "DAMAGED"
	OpnameReasonMiscount = "MISCOUNT"
	OpnameReasonReturn   = "RETURN"
)

type StockOpname struct {
	ID          int64     `gorm:"primaryKey;column:id" json:"id"`
	SKU         string    `gorm:"column:sku;type:varchar(50);not null" json:"sku"`
	StokSebelum int       `gorm:"column:stok_sebelum;not null" json:"stok_sebelum"`
	StokSesudah int       `gorm:"column:stok_sesudah;not null" json:"stok_sesudah"`
	Alasan      string    `gorm:"column:alasan;type:varchar(30);not null" json:"alasan"`
	ActorID     int64     `gorm:"column:actor_id;not null" json:"actor_id"`
	CreatedAt   time.Time `gorm:"column:created_at" json:"created_at"`
}

func (StockOpname) TableName() string { return "stok_opname" }
