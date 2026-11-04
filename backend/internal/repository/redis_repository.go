package repository

import (
	"errors"
	"time"

	"github.com/go-redis/redis"
)

var ErrRedisDisabled = errors.New("redis disabled")

var incrScript = redis.NewScript(`
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
return {count, redis.call("PTTL", KEYS[1])}
`)

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

func (r *RedisRepository) Incr(key string, window time.Duration) (int64, time.Duration, error) {
	if !r.Enabled() {
		return 0, 0, ErrRedisDisabled
	}

	result, err := incrScript.Run(r.client, []string{key}, window.Milliseconds()).Result()
	if err != nil {
		return 0, 0, err
	}

	values, ok := result.([]interface{})
	if !ok || len(values) != 2 {
		return 0, 0, errors.New("unexpected redis incr response")
	}

	count, _ := values[0].(int64)
	ttlMillis, _ := values[1].(int64)
	if ttlMillis < 0 {
		ttlMillis = window.Milliseconds()
	}

	return count, time.Duration(ttlMillis) * time.Millisecond, nil
}

func (r *RedisRepository) Close() error {
	if !r.Enabled() {
		return nil
	}
	return r.client.Close()
}
