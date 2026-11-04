package config

import (
	"crypto/tls"
	"net"
	"time"

	"github.com/go-redis/redis"
)

func NewRedisClient(cfg *Config) *redis.Client {
	var tlsConfig *tls.Config
	if cfg.RedisTLS {
		host, _, err := net.SplitHostPort(cfg.RedisAddr)
		if err != nil {
			host = cfg.RedisAddr
		}
		tlsConfig = &tls.Config{
			MinVersion: tls.VersionTLS12,
			ServerName: host,
		}
	}

	return redis.NewClient(&redis.Options{
		Addr:         cfg.RedisAddr,
		Password:     cfg.RedisPassword,
		DB:           0,
		TLSConfig:    tlsConfig,
		DialTimeout:  500 * time.Millisecond,
		ReadTimeout:  500 * time.Millisecond,
		WriteTimeout: 500 * time.Millisecond,
		PoolSize:     20,
		MaxRetries:   1,
	})
}
