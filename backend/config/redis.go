package config

import (
	"github.com/go-redis/redis"
)

func NewRedisClient(cfg *Config) *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       0,
	})
}
