package service

import (
	"context"
	"time"
)

var (
	SMTPStorageBackoff = []time.Duration{15 * time.Second, 30 * time.Second, 60 * time.Second}
	DatabaseBackoff    = []time.Duration{10 * time.Second, 10 * time.Second, 10 * time.Second}
	StorageBackoff     = []time.Duration{2 * time.Second, 5 * time.Second, 10 * time.Second}
)

func Retry(ctx context.Context, retries int, delays []time.Duration, fn func() error) error {
	var err error
	for attempt := 0; attempt <= retries; attempt++ {
		if err = fn(); err == nil {
			return nil
		}
		if attempt == retries {
			break
		}

		delay := delays[len(delays)-1]
		if attempt < len(delays) {
			delay = delays[attempt]
		}

		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(delay):
		}
	}
	return err
}
