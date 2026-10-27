package repository

import (
	"time"

	"github.com/go-redis/redis"
)

type RedisRepository struct {
	client *redis.Client
}

func NewRedisRepository(client *redis.Client) *RedisRepository {
	return &RedisRepository{client: client}
}

func (r *RedisRepository) TryLock(key string, ttl time.Duration) (bool, error) {
	ok, err := r.client.SetNX(key, "running", ttl).Result()
	if err != nil {
		return false, err
	}
	return ok, nil
}

func (r *RedisRepository) Unlock(key string) {
	r.client.Del(key)
}

func (r *RedisRepository) Get(key string) (string, error) {
	return r.client.Get(key).Result()
}

func (r *RedisRepository) Set(key, value string, ttl time.Duration) error {
	return r.client.Set(key, value, ttl).Err()
}

func (r *RedisRepository) Delete(key string) {
	r.client.Del(key)
}

func (r *RedisRepository) DeleteKeys(keys ...string) {
	if len(keys) == 0 {
		return
	}
	r.client.Del(keys...)
}

func (r *RedisRepository) Ping() error {
	return r.client.Ping().Err()
}
