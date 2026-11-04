package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestErrorHidesInternalServerDetails(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/", func(c *gin.Context) {
		Error(c, http.StatusInternalServerError, "Gagal memproses permintaan", "database password leaked")
	})

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/", nil))

	var response Response
	if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
		t.Fatal(err)
	}
	if response.Error != "internal server error" {
		t.Fatalf("error = %v, want generic server error", response.Error)
	}
	if response.Message != "Gagal memproses permintaan" {
		t.Fatalf("message = %q", response.Message)
	}
}
