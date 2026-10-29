package model

import "time"

const (
	POStatusDraft           = "DRAFT"
	POStatusPendingApproval = "PENDING_APPROVAL"
	POStatusSent            = "SENT"
	POStatusRejected        = "REJECTED"
	POStatusManualReview    = "REQUIRES_MANUAL_REVIEW"
)

type POLog struct {
	ID          int64      `gorm:"primaryKey;column:id" json:"id"`
	NomorPO     string     `gorm:"column:nomor_po;type:varchar(50);not null;uniqueIndex" json:"nomor_po"`
	IDPemasok   int64      `gorm:"column:id_pemasok;not null" json:"id_pemasok"`
	Status      string     `gorm:"column:status;type:varchar(30);not null;index:idx_po_status_created,priority:1" json:"status"`
	TautanPDF   string     `gorm:"column:tautan_pdf;type:text;not null" json:"tautan_pdf"`
	Token       string     `gorm:"column:token;type:varchar(64);uniqueIndex" json:"-"`
	SubmittedAt *time.Time `gorm:"column:submitted_at" json:"submitted_at,omitempty"`
	CreatedAt   time.Time  `gorm:"column:created_at;index:idx_po_status_created,priority:2" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"column:updated_at" json:"updated_at"`
	Pemasok     *Pemasok   `gorm:"foreignKey:IDPemasok;references:ID" json:"pemasok,omitempty"`
	Details     []PODetail `gorm:"foreignKey:POID;references:ID" json:"details,omitempty"`
}

func (POLog) TableName() string { return "po_log" }

type PODetail struct {
	ID          int64  `gorm:"primaryKey;column:id" json:"id"`
	POID        int64  `gorm:"column:po_id;not null;index:idx_po_detail_po_id" json:"po_id"`
	SKU         string `gorm:"column:sku;type:varchar(50);not null;index:idx_po_detail_sku" json:"sku"`
	JumlahOrder int    `gorm:"column:jumlah_order;not null" json:"jumlah_order"`
}

func (PODetail) TableName() string { return "po_detail" }
