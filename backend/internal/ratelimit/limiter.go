package ratelimit

import (
	"sync"
	"time"

	"reorderflow-backend/internal/repository"
)

const (
	redisRetryAfter = 30 * time.Second
	pruneThreshold  = 1000
)

type entry struct {
	count   int
	resetAt time.Time
}

type Limiter struct {
	redis *repository.RedisRepository

	mu             sync.Mutex
	items          map[string]entry
	redisDownUntil time.Time
}

func New(redisRepo *repository.RedisRepository) *Limiter {
	return &Limiter{
		redis: redisRepo,
		items: make(map[string]entry),
	}
}

func (l *Limiter) Allow(key string, limit int, window time.Duration) (bool, time.Duration) {
	if limit <= 0 || window <= 0 {
		return true, 0
	}

	if l.redisReady() {
		count, retryAfter, err := l.redis.Incr(key, window)
		if err == nil {
			return count <= int64(limit), retryAfter
		}
		l.markRedisDown()
	}

	return l.allowMemory(key, limit, window)
}

func (l *Limiter) allowMemory(key string, limit int, window time.Duration) (bool, time.Duration) {
	now := time.Now()

	l.mu.Lock()
	defer l.mu.Unlock()

	if len(l.items) > pruneThreshold {
		l.pruneLocked(now)
	}

	current, exists := l.items[key]
	if !exists || !now.Before(current.resetAt) {
		l.items[key] = entry{count: 1, resetAt: now.Add(window)}
		return true, 0
	}

	if current.count >= limit {
		return false, current.resetAt.Sub(now)
	}

	current.count++
	l.items[key] = current
	return true, 0
}

func (l *Limiter) pruneLocked(now time.Time) {
	for key, item := range l.items {
		if !now.Before(item.resetAt) {
			delete(l.items, key)
		}
	}
}

func (l *Limiter) redisReady() bool {
	if l.redis == nil || !l.redis.Enabled() {
		return false
	}

	l.mu.Lock()
	defer l.mu.Unlock()
	return !time.Now().Before(l.redisDownUntil)
}

func (l *Limiter) markRedisDown() {
	l.mu.Lock()
	l.redisDownUntil = time.Now().Add(redisRetryAfter)
	l.mu.Unlock()
}
