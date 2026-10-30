package repository

import (
	"errors"
	"time"

	"github.com/go-redis/redis"
)

var ErrRedisDisabled = errors.New("redis disabled")

type RedisRepository struct {
	client *redis.Client
}

func NewRedisRepository(client *redis.Client) *RedisRepository {
	return &RedisRepository{client: client}
}

func (r *RedisRepository) Enabled() bool {
	return r != nil && r.client != nil
}

func (r *RedisRepository) TryLock(key string, ttl time.Duration) (bool, error) {
	if !r.Enabled() {
		return false, ErrRedisDisabled
	}
	ok, err := r.client.SetNX(key, "running", ttl).Result()
	if err != nil {
		return false, err
	}
	return ok, nil
}

func (r *RedisRepository) Unlock(key string) {
	if !r.Enabled() {
		return
	}
	r.client.Del(key)
}

func (r *RedisRepository) Get(key string) (string, error) {
	if !r.Enabled() {
		return "", ErrRedisDisabled
	}
	return r.client.Get(key).Result()
}

func (r *RedisRepository) Set(key, value string, ttl time.Duration) error {
	if !r.Enabled() {
		return ErrRedisDisabled
	}
	return r.client.Set(key, value, ttl).Err()
}

func (r *RedisRepository) Delete(key string) {
	if !r.Enabled() {
		return
	}
	r.client.Del(key)
}

func (r *RedisRepository) DeleteKeys(keys ...string) {
	if !r.Enabled() || len(keys) == 0 {
		return
	}
	r.client.Del(keys...)
}

func (r *RedisRepository) Ping() error {
	if !r.Enabled() {
		return ErrRedisDisabled
	}
	return r.client.Ping().Err()
}
