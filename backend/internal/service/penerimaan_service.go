package service

import (
	"context"

	"reorderflow-backend/internal/cache"
	"reorderflow-backend/internal/model"
	"reorderflow-backend/internal/repository"
)

type PenerimaanService struct {
	repo  *repository.PenerimaanRepository
	cache *cache.Cache
}

func NewPenerimaanService(repo *repository.PenerimaanRepository, cacheStore *cache.Cache) *PenerimaanService {
	return &PenerimaanService{repo: repo, cache: cacheStore}
}

func (s *PenerimaanService) Get(poID int64) (*model.PenerimaanView, error) {
	return s.repo.GetSummary(poID)
}

func (s *PenerimaanService) Record(ctx context.Context, poID, actorID int64, items []model.PenerimaanItemRequest) (*model.POLog, error) {
	if len(items) == 0 {
		return nil, repository.ErrPenerimaanEmpty
	}

	po, err := s.repo.RecordReceipt(ctx, poID, actorID, items)
	if err != nil {
		return nil, err
	}

	s.cache.Invalidate()
	return po, nil
}
