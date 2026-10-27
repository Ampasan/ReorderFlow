package repository

import (
	"errors"

	"gorm.io/gorm"

	"reorderflow-backend/internal/model"
)

type PemasokRepository struct {
	db *gorm.DB
}

func NewPemasokRepository(db *gorm.DB) *PemasokRepository {
	return &PemasokRepository{db: db}
}

func (r *PemasokRepository) GetByID(id int64) (*model.Pemasok, error) {
	var p model.Pemasok
	if err := r.db.First(&p, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, err
	}
	return &p, nil
}

func (r *PemasokRepository) GetAll() ([]model.Pemasok, error) {
	var list []model.Pemasok
	if err := r.db.Order("id ASC").Find(&list).Error; err != nil {
		return nil, err
	}
	return list, nil
}
