package ratelimit

import (
	"testing"
	"time"

	"github.com/go-redis/redis"

	"reorderflow-backend/internal/repository"
)

func TestAllowWithinLimit(t *testing.T) {
	limiter := New(nil)

	for i := 0; i < 3; i++ {
		allowed, _ := limiter.Allow("key", 3, time.Minute)
		if !allowed {
			t.Fatalf("expected request %d to be allowed", i+1)
		}
	}

	allowed, retryAfter := limiter.Allow("key", 3, time.Minute)
	if allowed {
		t.Fatal("expected fourth request to be denied")
	}
	if retryAfter <= 0 {
		t.Fatalf("expected positive retry-after, got %s", retryAfter)
	}
}

func TestAllowResetsAfterWindow(t *testing.T) {
	limiter := New(nil)

	if allowed, _ := limiter.Allow("key", 1, 20*time.Millisecond); !allowed {
		t.Fatal("expected first request to be allowed")
	}
	if allowed, _ := limiter.Allow("key", 1, 20*time.Millisecond); allowed {
		t.Fatal("expected second request to be denied")
	}

	time.Sleep(30 * time.Millisecond)

	if allowed, _ := limiter.Allow("key", 1, 20*time.Millisecond); !allowed {
		t.Fatal("expected request to be allowed after window reset")
	}
}

func TestAllowSeparatesKeys(t *testing.T) {
	limiter := New(nil)

	if allowed, _ := limiter.Allow("a", 1, time.Minute); !allowed {
		t.Fatal("expected first key to be allowed")
	}
	if allowed, _ := limiter.Allow("a", 1, time.Minute); allowed {
		t.Fatal("expected first key to be exhausted")
	}
	if allowed, _ := limiter.Allow("b", 1, time.Minute); !allowed {
		t.Fatal("expected second key to have its own window")
	}
}

func TestAllowDisabledLimit(t *testing.T) {
	limiter := New(nil)

	for i := 0; i < 5; i++ {
		if allowed, _ := limiter.Allow("key", 0, time.Minute); !allowed {
			t.Fatal("expected limit of zero to disable throttling")
		}
	}
}

func TestAllowWithRedis(t *testing.T) {
	client := redis.NewClient(&redis.Options{
		Addr:        "localhost:6379",
		DialTimeout: 200 * time.Millisecond,
	})
	if err := client.Ping().Err(); err != nil {
		t.Skip("redis not available")
	}
	defer client.Close()

	repo := repository.NewRedisRepository(client)
	limiter := New(repo)
	key := "test:" + time.Now().Format("150405.000000000")
	defer repo.Delete(key)

	for i := 0; i < 3; i++ {
		if allowed, _ := limiter.Allow(key, 3, time.Minute); !allowed {
			t.Fatalf("expected request %d to be allowed", i+1)
		}
	}

	allowed, retryAfter := limiter.Allow(key, 3, time.Minute)
	if allowed {
		t.Fatal("expected fourth request to be denied")
	}
	if retryAfter <= 0 {
		t.Fatalf("expected positive retry-after, got %s", retryAfter)
	}
}
