package repository

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"reorderflow-backend/internal/model"
)

var (
	ErrPONotReceivable       = errors.New("po tidak dalam status yang bisa menerima barang")
	ErrPenerimaanEmpty       = errors.New("minimal satu barang harus diterima")
	ErrPenerimaanItemInvalid = errors.New("barang tidak termasuk dalam PO ini")
	ErrQtyOverRemaining      = errors.New("qty diterima melebihi sisa pesanan")
)

type PenerimaanRepository struct {
	db *gorm.DB
}

func NewPenerimaanRepository(db *gorm.DB) *PenerimaanRepository {
	return &PenerimaanRepository{db: db}
}

func (r *PenerimaanRepository) GetSummary(poID int64) (*model.PenerimaanView, error) {
	var po model.POLog
	if err := r.db.Preload("Details").First(&po, poID).Error; err != nil {
		return nil, err
	}

	received, err := receivedTotals(r.db, poID)
	if err != nil {
		return nil, err
	}

	var headers []model.Penerimaan
	if err := r.db.Preload("Details").
		Where("po_id = ?", poID).
		Order("created_at ASC").
		Order("id ASC").
		Find(&headers).Error; err != nil {
		return nil, err
	}

	skus := make([]string, 0, len(po.Details))
	for _, detail := range po.Details {
		skus = append(skus, detail.SKU)
	}
	for _, header := range headers {
		for _, detail := range header.Details {
			skus = append(skus, detail.SKU)
		}
	}

	names, err := r.stokNames(skus)
	if err != nil {
		return nil, err
	}

	items := make([]model.PenerimaanItemView, 0, len(po.Details))
	for _, detail := range po.Details {
		sudah := received[detail.SKU]
		items = append(items, model.PenerimaanItemView{
			SKU:           detail.SKU,
			Nama:          names[detail.SKU],
			JumlahOrder:   detail.JumlahOrder,
			SudahDiterima: sudah,
			Sisa:          detail.JumlahOrder - sudah,
		})
	}

	riwayat := make([]model.PenerimaanRiwayatView, 0, len(headers))
	for _, header := range headers {
		lines := make([]model.PenerimaanRiwayatItemView, 0, len(header.Details))
		for _, detail := range header.Details {
			lines = append(lines, model.PenerimaanRiwayatItemView{
				SKU:         detail.SKU,
				Nama:        names[detail.SKU],
				QtyDiterima: detail.QtyDiterima,
			})
		}
		riwayat = append(riwayat, model.PenerimaanRiwayatView{
			ID:        header.ID,
			CreatedAt: header.CreatedAt,
			Items:     lines,
		})
	}

	return &model.PenerimaanView{
		POID:    po.ID,
		NomorPO: po.NomorPO,
		Status:  po.Status,
		Items:   items,
		Riwayat: riwayat,
	}, nil
}

func (r *PenerimaanRepository) RecordReceipt(ctx context.Context, poID, actorID int64, items []model.PenerimaanItemRequest) (*model.POLog, error) {
	var po model.POLog

	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Select("id", "status").
			First(&po, poID).Error; err != nil {
			return err
		}
		if po.Status != model.POStatusSent && po.Status != model.POStatusPartiallyReceived {
			return ErrPONotReceivable
		}

		var details []model.PODetail
		if err := tx.Where("po_id = ?", poID).Order("id ASC").Find(&details).Error; err != nil {
			return err
		}
		orderBySKU := make(map[string]int, len(details))
		for _, detail := range details {
			orderBySKU[detail.SKU] = detail.JumlahOrder
		}

		received, err := receivedTotals(tx, poID)
		if err != nil {
			return err
		}

		accepted := make(map[string]int, len(items))
		seen := make(map[string]struct{}, len(items))
		totalAccepted := 0
		for _, item := range items {
			jumlahOrder, ok := orderBySKU[item.SKU]
			if !ok || item.QtyDiterima < 0 {
				return ErrPenerimaanItemInvalid
			}
			if _, duplicate := seen[item.SKU]; duplicate {
				return ErrPenerimaanItemInvalid
			}
			seen[item.SKU] = struct{}{}
			if item.QtyDiterima > jumlahOrder-received[item.SKU] {
				return ErrQtyOverRemaining
			}
			if item.QtyDiterima > 0 {
				accepted[item.SKU] = item.QtyDiterima
				totalAccepted += item.QtyDiterima
			}
		}
		if totalAccepted == 0 {
			return ErrPenerimaanEmpty
		}

		now := time.Now()
		header := model.Penerimaan{POID: poID, ActorID: actorID, CreatedAt: now}
		if err := tx.Create(&header).Error; err != nil {
			return err
		}

		lines := make([]model.PenerimaanDetail, 0, len(accepted))
		for sku, qty := range accepted {
			lines = append(lines, model.PenerimaanDetail{
				PenerimaanID: header.ID,
				SKU:          sku,
				QtyDiterima:  qty,
			})
		}
		if err := tx.Create(&lines).Error; err != nil {
			return err
		}

		for sku, qty := range accepted {
			if err := tx.Model(&model.Stok{}).
				Where("sku = ?", sku).
				Updates(map[string]interface{}{
					"stok_saat_ini": gorm.Expr("stok_saat_ini + ?", qty),
					"updated_at":    now,
				}).Error; err != nil {
				return err
			}
		}

		status := model.POStatusReceived
		for sku, jumlahOrder := range orderBySKU {
			if received[sku]+accepted[sku] < jumlahOrder {
				status = model.POStatusPartiallyReceived
				break
			}
		}

		return tx.Model(&model.POLog{}).
			Where("id = ?", poID).
			Updates(map[string]interface{}{
				"status":     status,
				"updated_at": now,
			}).Error
	})
	if err != nil {
		return nil, err
	}

	var updated model.POLog
	if err := r.db.Preload("Pemasok").Preload("Details").First(&updated, poID).Error; err != nil {
		return nil, err
	}
	return &updated, nil
}

func receivedTotals(db *gorm.DB, poID int64) (map[string]int, error) {
	type row struct {
		SKU   string
		Total int
	}

	var rows []row
	if err := db.Table("po_penerimaan_detail AS d").
		Select("d.sku AS sku, COALESCE(SUM(d.qty_diterima), 0) AS total").
		Joins("JOIN po_penerimaan p ON p.id = d.penerimaan_id").
		Where("p.po_id = ?", poID).
		Group("d.sku").
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	totals := make(map[string]int, len(rows))
	for _, row := range rows {
		totals[row.SKU] = row.Total
	}
	return totals, nil
}

func (r *PenerimaanRepository) stokNames(skus []string) (map[string]string, error) {
	names := make(map[string]string, len(skus))
	if len(skus) == 0 {
		return names, nil
	}

	var rows []struct {
		SKU  string
		Nama string
	}
	if err := r.db.Model(&model.Stok{}).
		Select("sku, nama").
		Where("sku IN ?", skus).
		Find(&rows).Error; err != nil {
		return nil, err
	}
	for _, row := range rows {
		names[row.SKU] = row.Nama
	}
	return names, nil
}
