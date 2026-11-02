package handler

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestRegisterFrontend(t *testing.T) {
	gin.SetMode(gin.TestMode)

	dist := t.TempDir()
	writeFile(t, filepath.Join(dist, "index.html"), "<html>app</html>")
	writeFile(t, filepath.Join(dist, "robots.txt"), "User-agent: *")
	writeFile(t, filepath.Join(dist, "assets", "app.js"), "console.log('app')")

	router := gin.New()
	router.GET("/api/ping", func(c *gin.Context) {
		c.String(http.StatusOK, "pong")
	})
	RegisterFrontend(router, dist)

	tests := []struct {
		path       string
		wantStatus int
		wantBody   string
		wantCache  string
	}{
		{"/", http.StatusOK, "<html>app</html>", "no-cache"},
		{"/stok", http.StatusOK, "<html>app</html>", "no-cache"},
		{"/robots.txt", http.StatusOK, "User-agent: *", "public, max-age=604800"},
		{"/assets/app.js", http.StatusOK, "console.log('app')", "public, max-age=31536000, immutable"},
	}

	for _, tt := range tests {
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, tt.path, nil))

		if rec.Code != tt.wantStatus {
			t.Errorf("%s: status = %d, want %d", tt.path, rec.Code, tt.wantStatus)
		}
		if !strings.Contains(rec.Body.String(), tt.wantBody) {
			t.Errorf("%s: body = %q, want to contain %q", tt.path, rec.Body.String(), tt.wantBody)
		}
		if got := rec.Header().Get("Cache-Control"); got != tt.wantCache {
			t.Errorf("%s: Cache-Control = %q, want %q", tt.path, got, tt.wantCache)
		}
	}

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/missing", nil))
	if rec.Code != http.StatusNotFound {
		t.Errorf("/api/missing: status = %d, want %d", rec.Code, http.StatusNotFound)
	}
	if !strings.Contains(rec.Body.String(), `"success":false`) {
		t.Errorf("/api/missing: body = %q, want JSON error envelope", rec.Body.String())
	}
}

func TestRegisterFrontendWithoutBuild(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	RegisterFrontend(router, filepath.Join(t.TempDir(), "missing"))

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/", nil))
	if rec.Code != http.StatusNotFound {
		t.Errorf("status = %d, want %d (no NoRoute registered)", rec.Code, http.StatusNotFound)
	}
}

func writeFile(t *testing.T, path, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}
