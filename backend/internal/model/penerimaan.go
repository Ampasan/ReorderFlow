package model

import "time"

type Penerimaan struct {
	ID        int64              `gorm:"primaryKey;column:id" json:"id"`
	POID      int64              `gorm:"column:po_id;not null;index" json:"po_id"`
	ActorID   int64              `gorm:"column:actor_id;not null" json:"actor_id"`
	CreatedAt time.Time          `gorm:"column:created_at" json:"created_at"`
	Details   []PenerimaanDetail `gorm:"foreignKey:PenerimaanID;references:ID" json:"details,omitempty"`
}

func (Penerimaan) TableName() string { return "po_penerimaan" }

type PenerimaanDetail struct {
	ID           int64  `gorm:"primaryKey;column:id" json:"id"`
	PenerimaanID int64  `gorm:"column:penerimaan_id;not null;index" json:"penerimaan_id"`
	SKU          string `gorm:"column:sku;type:varchar(50);not null;index" json:"sku"`
	QtyDiterima  int    `gorm:"column:qty_diterima;not null" json:"qty_diterima"`
}

func (PenerimaanDetail) TableName() string { return "po_penerimaan_detail" }
