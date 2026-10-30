package cache

import (
	"encoding/json"
	"sync"
	"time"

	"github.com/go-redis/redis"

	"reorderflow-backend/internal/model"
	"reorderflow-backend/internal/repository"
)

const ttl = 60 * time.Second

// After a failed Redis call, skip L2 for a while instead of paying the
// timeout on every request.
const redisRetryAfter = 30 * time.Second

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

type memoryEntry struct {
	raw       []byte
	expiresAt time.Time
}

type Cache struct {
	redis *repository.RedisRepository
	mu    sync.RWMutex
	items map[string]memoryEntry

	redisDownUntil time.Time
}

func New(redisRepo *repository.RedisRepository) *Cache {
	return &Cache{
		redis: redisRepo,
		items: make(map[string]memoryEntry),
	}
}

func (c *Cache) Get(key string, dst interface{}) bool {
	now := time.Now()

	// L1 in-memory cache first: sub-millisecond and never touches the network.
	c.mu.RLock()
	entry, found := c.items[key]
	c.mu.RUnlock()

	if found && now.Before(entry.expiresAt) {
		return json.Unmarshal(entry.raw, dst) == nil
	}

	if !c.redisReady() {
		return false
	}

	raw, err := c.redis.Get(key)
	if err != nil {
		if err != redis.Nil {
			c.markRedisDown()
		}
		return false
	}
	if raw == "" {
		return false
	}

	byteData := []byte(raw)
	if json.Unmarshal(byteData, dst) != nil {
		return false
	}

	// Populate L1 for subsequent requests.
	c.mu.Lock()
	c.items[key] = memoryEntry{raw: byteData, expiresAt: now.Add(ttl)}
	c.mu.Unlock()
	return true
}

func (c *Cache) Set(key string, value interface{}) {
	raw, err := json.Marshal(value)
	if err != nil {
		return
	}

	c.mu.Lock()
	c.items[key] = memoryEntry{raw: raw, expiresAt: time.Now().Add(ttl)}
	c.mu.Unlock()

	if !c.redisReady() {
		return
	}
	if err := c.redis.Set(key, string(raw), ttl); err != nil {
		c.markRedisDown()
	}
}

func (c *Cache) Invalidate() {
	c.mu.Lock()
	c.items = make(map[string]memoryEntry)
	c.mu.Unlock()

	if c.redisReady() {
		c.redis.DeleteKeys(keys...)
	}
}

func (c *Cache) redisReady() bool {
	if c.redis == nil || !c.redis.Enabled() {
		return false
	}

	c.mu.RLock()
	down := time.Now().Before(c.redisDownUntil)
	c.mu.RUnlock()
	return !down
}

func (c *Cache) markRedisDown() {
	c.mu.Lock()
	c.redisDownUntil = time.Now().Add(redisRetryAfter)
	c.mu.Unlock()
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
