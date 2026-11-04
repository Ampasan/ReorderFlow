package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestAnalyzeLowStockRequiresGeminiKey(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/stok/ai-analysis", NewStockHandler(nil, nil, nil, nil).AnalyzeLowStock)

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodPost, "/api/stok/ai-analysis", nil))

	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusServiceUnavailable)
	}
	if !strings.Contains(recorder.Body.String(), "GEMINI_API_KEY") {
		t.Errorf("response = %q, want configuration message", recorder.Body.String())
	}
}
