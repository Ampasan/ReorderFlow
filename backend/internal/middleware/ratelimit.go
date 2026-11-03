package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"reorderflow-backend/internal/ratelimit"
)

func RateLimit(limiter *ratelimit.Limiter, name string, limit int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !allowRequest(c, limiter, "rl:"+name+":"+c.ClientIP(), limit, window) {
			return
		}
		c.Next()
	}
}

func LoginRateLimit(limiter *ratelimit.Limiter, limit int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !allowRequest(c, limiter, "rl:login:ip:"+c.ClientIP(), limit, window) {
			return
		}

		var payload struct {
			Email string `json:"email"`
		}
		raw, err := c.GetRawData()
		if err == nil {
			c.Request.Body = io.NopCloser(bytes.NewReader(raw))
			_ = json.Unmarshal(raw, &payload)
		}

		email := strings.ToLower(strings.TrimSpace(payload.Email))
		if email != "" && !allowRequest(c, limiter, "rl:login:email:"+email, limit, window) {
			return
		}

		c.Next()
	}
}

func allowRequest(c *gin.Context, limiter *ratelimit.Limiter, key string, limit int, window time.Duration) bool {
	allowed, retryAfter := limiter.Allow(key, limit, window)
	if allowed {
		return true
	}

	seconds := int(math.Ceil(retryAfter.Seconds()))
	if seconds < 1 {
		seconds = 1
	}

	c.Header("Retry-After", strconv.Itoa(seconds))
	c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
		"success": false,
		"message": "Terlalu banyak permintaan. Coba lagi nanti.",
		"data":    nil,
		"error":   "rate limit exceeded",
	})
	return false
}
