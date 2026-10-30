package config

import (
	"time"

	"github.com/go-redis/redis"
)

func NewRedisClient(cfg *Config) *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       0,
		// Keep a missing Redis from adding seconds to every request: without
		// these, go-redis falls back to a 5s dial timeout per call.
		DialTimeout:  500 * time.Millisecond,
		ReadTimeout:  500 * time.Millisecond,
		WriteTimeout: 500 * time.Millisecond,
		PoolSize:     20,
		MaxRetries:   1,
	})
}
