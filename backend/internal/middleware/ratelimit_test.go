package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"reorderflow-backend/internal/ratelimit"
)

func TestRateLimitBlocksAfterLimit(t *testing.T) {
	gin.SetMode(gin.TestMode)

	limiter := ratelimit.New(nil)
	router := gin.New()
	router.Use(RateLimit(limiter, "test", 1, time.Minute))
	router.GET("/", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	first := httptest.NewRecorder()
	router.ServeHTTP(first, httptest.NewRequest(http.MethodGet, "/", nil))
	if first.Code != http.StatusOK {
		t.Fatalf("expected first request 200, got %d", first.Code)
	}

	second := httptest.NewRecorder()
	router.ServeHTTP(second, httptest.NewRequest(http.MethodGet, "/", nil))
	if second.Code != http.StatusTooManyRequests {
		t.Fatalf("expected second request 429, got %d", second.Code)
	}
	if second.Header().Get("Retry-After") == "" {
		t.Fatal("expected Retry-After header")
	}
}

func TestLoginRateLimitSeparatesEmailFromIP(t *testing.T) {
	gin.SetMode(gin.TestMode)

	limiter := ratelimit.New(nil)
	router := gin.New()
	router.Use(LoginRateLimit(limiter, 1, time.Minute))
	router.POST("/login", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	first := httptest.NewRecorder()
	firstReq := httptest.NewRequest(http.MethodPost, "/login", strings.NewReader(`{"email":"admin@example.com"}`))
	firstReq.RemoteAddr = "10.0.0.1:1234"
	firstReq.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(first, firstReq)
	if first.Code != http.StatusOK {
		t.Fatalf("expected first request 200, got %d", first.Code)
	}

	second := httptest.NewRecorder()
	secondReq := httptest.NewRequest(http.MethodPost, "/login", strings.NewReader(`{"email":"admin@example.com"}`))
	secondReq.RemoteAddr = "10.0.0.2:1234"
	secondReq.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(second, secondReq)
	if second.Code != http.StatusTooManyRequests {
		t.Fatalf("expected second request with same email to be 429, got %d", second.Code)
	}
}

func TestRateLimitIgnoresForwardedIPWithoutTrustedProxy(t *testing.T) {
	gin.SetMode(gin.TestMode)

	limiter := ratelimit.New(nil)
	router := gin.New()
	if err := router.SetTrustedProxies(nil); err != nil {
		t.Fatal(err)
	}
	router.Use(RateLimit(limiter, "test", 1, time.Minute))
	router.GET("/", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	forwardedIPs := []string{"203.0.113.10", "203.0.113.11"}
	for i, forwardedIP := range forwardedIPs {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.RemoteAddr = "192.0.2.1:1234"
		req.Header.Set("X-Forwarded-For", forwardedIP)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		wantStatus := http.StatusOK
		if i == 1 {
			wantStatus = http.StatusTooManyRequests
		}
		if rec.Code != wantStatus {
			t.Fatalf("forwarded IP %s: status = %d, want %d", forwardedIP, rec.Code, wantStatus)
		}
	}
}
