package middleware

import (
	"compress/gzip"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestGzipCompressesJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(Gzip())
	r.GET("/x", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"hello": "world"})
	})

	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	req.Header.Set("Accept-Encoding", "gzip")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Header().Get("Content-Encoding") != "gzip" {
		t.Fatalf("expected gzip encoding, got %q", w.Header().Get("Content-Encoding"))
	}
	if w.Header().Get("Vary") != "Accept-Encoding" {
		t.Fatalf("expected Vary: Accept-Encoding, got %q", w.Header().Get("Vary"))
	}

	gr, err := gzip.NewReader(w.Body)
	if err != nil {
		t.Fatalf("response is not valid gzip: %v", err)
	}
	defer gr.Close()

	body, err := io.ReadAll(gr)
	if err != nil {
		t.Fatalf("read gzip body: %v", err)
	}

	var got map[string]string
	if err := json.Unmarshal(body, &got); err != nil {
		t.Fatalf("unmarshal body %q: %v", body, err)
	}
	if got["hello"] != "world" {
		t.Fatalf("unexpected body: %v", got)
	}
}

func TestGzipRemovesContentLength(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(Gzip())
	r.GET("/x", func(c *gin.Context) {
		c.Header("Content-Length", "5")
		c.String(http.StatusOK, "hello")
	})

	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	req.Header.Set("Accept-Encoding", "gzip")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if got := w.Header().Get("Content-Length"); got != "" {
		t.Fatalf("Content-Length = %q, want empty for compressed response", got)
	}
}

func TestGzipSkipsStaticAssets(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(Gzip())
	r.GET("/assets/app.js", func(c *gin.Context) {
		c.String(http.StatusOK, "console.log('ok')")
	})

	req := httptest.NewRequest(http.MethodGet, "/assets/app.js", nil)
	req.Header.Set("Accept-Encoding", "gzip")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if got := w.Header().Get("Content-Encoding"); got != "" {
		t.Fatalf("Content-Encoding = %q, want empty", got)
	}
	if w.Body.String() != "console.log('ok')" {
		t.Fatalf("unexpected body: %q", w.Body.String())
	}
}

func TestGzipPassthroughWithoutAcceptEncoding(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(Gzip())
	r.GET("/x", func(c *gin.Context) {
		c.String(http.StatusOK, "plain")
	})

	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Header().Get("Content-Encoding") == "gzip" {
		t.Fatal("did not expect gzip encoding")
	}
	if strings.TrimSpace(w.Body.String()) != "plain" {
		t.Fatalf("unexpected body: %q", w.Body.String())
	}
}
