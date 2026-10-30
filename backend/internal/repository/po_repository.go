package repository

import (
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"reorderflow-backend/internal/model"
)

type PORepository struct {
	db *gorm.DB
}

func NewPORepository(db *gorm.DB) *PORepository {
	return &PORepository{db: db}
}

func (r *PORepository) Create(po *model.POLog, details []model.PODetail) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(po).Error; err != nil {
			return err
		}
		for i := range details {
			details[i].POID = po.ID
		}
		if len(details) > 0 {
			if err := tx.Create(&details).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *PORepository) GetByID(id int64) (*model.POLog, error) {
	var po model.POLog
	if err := r.db.Preload("Pemasok").Preload("Details").First(&po, id).Error; err != nil {
		return nil, err
	}
	return &po, nil
}

func (r *PORepository) GetByToken(token string) (*model.POLog, error) {
	var po model.POLog
	if err := r.db.Preload("Pemasok").Preload("Details").
		Where("token = ?", token).
		First(&po).Error; err != nil {
		return nil, err
	}
	return &po, nil
}

func (r *PORepository) GetByNomorPO(nomor string) (*model.POLog, error) {
	var po model.POLog
	if err := r.db.Where("nomor_po = ?", nomor).First(&po).Error; err != nil {
		return nil, err
	}
	return &po, nil
}

func (r *PORepository) List(filter string) ([]model.POLog, error) {
	q := r.db.Joins("Pemasok").Preload("Details")

	if filter != "" && filter != "all" {
		q = q.Where("po_log.status = ?", filter)
	}

	list := make([]model.POLog, 0)
	if err := q.Order("po_log.created_at DESC").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}

func (r *PORepository) GetLatestPONumber(prefix string) (string, error) {
	var nomor string
	if err := r.db.Model(&model.POLog{}).
		Select("nomor_po").
		Where("nomor_po LIKE ?", prefix+"%").
		Order("nomor_po DESC").
		Limit(1).
		Scan(&nomor).Error; err != nil {
		return "", err
	}
	return nomor, nil
}

func (r *PORepository) StatusCounts() (map[string]int64, error) {
	type statusCount struct {
		Status string
		Total  int64
	}

	var rows []statusCount
	if err := r.db.Model(&model.POLog{}).
		Select("status, COUNT(*) AS total").
		Group("status").
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	counts := make(map[string]int64, len(rows))
	for _, row := range rows {
		counts[row.Status] = row.Total
	}
	return counts, nil
}

func (r *PORepository) ReplaceDraftDetails(id int64, details []model.PODetail, pdfURL string) (bool, error) {
	updated := false

	err := r.db.Transaction(func(tx *gorm.DB) error {
		var po model.POLog
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Select("id", "status").
			First(&po, id).Error; err != nil {
			return err
		}
		if po.Status != model.POStatusDraft && po.Status != model.POStatusRejected {
			return nil
		}

		if err := tx.Where("po_id = ?", id).Delete(&model.PODetail{}).Error; err != nil {
			return err
		}
		for i := range details {
			details[i].POID = id
		}
		if len(details) > 0 {
			if err := tx.Create(&details).Error; err != nil {
				return err
			}
		}

		if err := tx.Model(&model.POLog{}).
			Where("id = ?", id).
			Updates(map[string]interface{}{
				"tautan_pdf": pdfURL,
				"updated_at": time.Now(),
			}).Error; err != nil {
			return err
		}

		updated = true
		return nil
	})
	if err != nil {
		return false, err
	}
	return updated, nil
}

func (r *PORepository) MarkSubmitted(id int64, pdfURL, token string, submittedAt time.Time) (bool, error) {
	res := r.db.Model(&model.POLog{}).
		Where("id = ? AND status IN ?", id, []string{model.POStatusDraft, model.POStatusRejected}).
		Updates(map[string]interface{}{
			"status":       model.POStatusPendingApproval,
			"tautan_pdf":   pdfURL,
			"token":        token,
			"submitted_at": submittedAt,
			"updated_at":   submittedAt,
		})
	if res.Error != nil {
		return false, res.Error
	}
	return res.RowsAffected > 0, nil
}

func (r *PORepository) UpdateStatusIfPending(id int64, newStatus string) (bool, error) {
	res := r.db.Model(&model.POLog{}).
		Where("id = ? AND status = ?", id, model.POStatusPendingApproval).
		Updates(map[string]interface{}{
			"status":     newStatus,
			"updated_at": time.Now(),
		})
	if res.Error != nil {
		return false, res.Error
	}
	return res.RowsAffected > 0, nil
}

func (r *PORepository) UpdateStatus(id int64, newStatus string) error {
	return r.db.Model(&model.POLog{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":     newStatus,
			"updated_at": time.Now(),
		}).Error
}

func (r *PORepository) GetActiveReferences(since time.Time) (map[string]struct{}, map[int64]struct{}, error) {
	activeStatuses := []string{model.POStatusDraft, model.POStatusPendingApproval, model.POStatusRejected, model.POStatusSent}
	openStatuses := []string{model.POStatusDraft, model.POStatusPendingApproval, model.POStatusRejected}
	activeSKUs := make(map[string]struct{})
	activeSuppliers := make(map[int64]struct{})

	var supplierIDs []int64
	if err := r.db.Model(&model.POLog{}).
		Where("status IN ? AND (status IN ? OR created_at >= ?)", activeStatuses, openStatuses, since).
		Pluck("id_pemasok", &supplierIDs).Error; err != nil {
		return nil, nil, err
	}
	for _, id := range supplierIDs {
		activeSuppliers[id] = struct{}{}
	}

	var skus []string
	if err := r.db.Table("po_detail").
		Joins("JOIN po_log ON po_log.id = po_detail.po_id").
		Where("po_log.status IN ? AND (po_log.status IN ? OR po_log.created_at >= ?)", activeStatuses, openStatuses, since).
		Pluck("po_detail.sku", &skus).Error; err != nil {
		return nil, nil, err
	}
	for _, sku := range skus {
		activeSKUs[sku] = struct{}{}
	}

	return activeSKUs, activeSuppliers, nil
}
