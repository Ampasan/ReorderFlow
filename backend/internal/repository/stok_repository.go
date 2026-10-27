package repository

import (
	"gorm.io/gorm"

	"reorderflow-backend/internal/model"
)

type StokRepository struct {
	db *gorm.DB
}

func NewStokRepository(db *gorm.DB) *StokRepository {
	return &StokRepository{db: db}
}

func (r *StokRepository) GetAll() ([]model.Stok, error) {
	return r.queryOrdered()
}

func (r *StokRepository) List(filter string) ([]model.Stok, error) {
	q := r.db.Joins("Pemasok")

	switch filter {
	case "low":
		q = q.Where("stok.stok_saat_ini <= stok.reorder_point AND stok.stok_saat_ini >= 0 AND stok.reorder_point > 0 AND stok.qty_min_order > 0")
	case "manual":
		q = q.Where("stok.stok_saat_ini < 0 OR stok.reorder_point <= 0 OR stok.qty_min_order <= 0")
	}

	var list []model.Stok
	if err := q.Order("stok.stok_saat_ini <= stok.reorder_point DESC").Order("stok.sku ASC").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *StokRepository) GetLowStockItems() ([]model.Stok, error) {
	var list []model.Stok
	if err := r.db.Joins("Pemasok").
		Where("stok.stok_saat_ini <= stok.reorder_point").
		Order("stok.id_pemasok ASC").
		Order("stok.sku ASC").
		Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *StokRepository) GetBySKU(sku string) (*model.Stok, error) {
	var s model.Stok
	if err := r.db.First(&s, "sku = ?", sku).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *StokRepository) UpdateStock(sku string, stock int) error {
	return r.db.Model(&model.Stok{}).Where("sku = ?", sku).Update("stok_saat_ini", stock).Error
}

func (r *StokRepository) Count() (int64, error) {
	var n int64
	if err := r.db.Model(&model.Stok{}).Count(&n).Error; err != nil {
		return 0, err
	}
	return n, nil
}

type StockCountSummary struct {
	Total        int64
	LowStock     int64
	ManualReview int64
}

func (r *StokRepository) CountSummary() (StockCountSummary, error) {
	var summary StockCountSummary
	err := r.db.Model(&model.Stok{}).
		Select(`COUNT(*) AS total,
			COUNT(*) FILTER (WHERE stok_saat_ini <= reorder_point AND stok_saat_ini >= 0 AND reorder_point > 0 AND qty_min_order > 0) AS low_stock,
			COUNT(*) FILTER (WHERE stok_saat_ini < 0 OR reorder_point <= 0 OR qty_min_order <= 0) AS manual_review`).
		Scan(&summary).Error
	return summary, err
}

func (r *StokRepository) queryOrdered() ([]model.Stok, error) {
	var list []model.Stok
	if err := r.db.Joins("Pemasok").
		Order("stok.stok_saat_ini <= stok.reorder_point DESC").
		Order("stok.sku ASC").
		Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}
