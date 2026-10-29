package cache

import (
	"encoding/json"
	"time"

	"reorderflow-backend/internal/model"
	"reorderflow-backend/internal/repository"
)

const ttl = 5 * time.Second

const (
	KeyDashboard = "cache:dashboard"
	stokPrefix   = "cache:stok:"
	poPrefix     = "cache:po:"
)

var keys = []string{
	KeyDashboard,
	stokPrefix + "all",
	stokPrefix + "low",
	stokPrefix + "manual",
	poPrefix + "all",
	poPrefix + model.POStatusDraft,
	poPrefix + model.POStatusPendingApproval,
	poPrefix + model.POStatusSent,
	poPrefix + model.POStatusRejected,
	poPrefix + model.POStatusManualReview,
}

type Cache struct {
	redis *repository.RedisRepository
}

func New(redisRepo *repository.RedisRepository) *Cache {
	return &Cache{redis: redisRepo}
}

func (c *Cache) Get(key string, dst interface{}) bool {
	raw, err := c.redis.Get(key)
	if err != nil || raw == "" {
		return false
	}
	return json.Unmarshal([]byte(raw), dst) == nil
}

func (c *Cache) Set(key string, value interface{}) {
	raw, err := json.Marshal(value)
	if err != nil {
		return
	}
	_ = c.redis.Set(key, string(raw), ttl)
}

func (c *Cache) Invalidate() {
	c.redis.DeleteKeys(keys...)
}

func StokKey(filter string) string {
	if filter == "low" || filter == "manual" {
		return stokPrefix + filter
	}
	return stokPrefix + "all"
}

func POKey(status string) (string, bool) {
	if status == "" {
		status = "all"
	}
	switch status {
	case "all", model.POStatusDraft, model.POStatusPendingApproval, model.POStatusSent, model.POStatusRejected, model.POStatusManualReview:
		return poPrefix + status, true
	default:
		return "", false
	}
}
