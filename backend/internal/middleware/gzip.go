package middleware

import (
	"compress/gzip"
	"io"
	"path"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
)

var gzipPool = sync.Pool{
	New: func() interface{} {
		writer, err := gzip.NewWriterLevel(io.Discard, gzip.BestSpeed)
		if err != nil {
			return gzip.NewWriter(io.Discard)
		}
		return writer
	},
}

type gzipWriter struct {
	gin.ResponseWriter
	gz *gzip.Writer
}

func skipCompression(requestPath string) bool {
	switch strings.ToLower(path.Ext(requestPath)) {
	case ".woff2", ".woff", ".ttf", ".otf", ".webp", ".png", ".jpg", ".jpeg", ".gif", ".ico",
		".gz", ".zip", ".pdf", ".mp4", ".css", ".js", ".mjs", ".map", ".html", ".xml", ".txt",
		".svg", ".wasm":
		return true
	default:
		return false
	}
}

func (w *gzipWriter) WriteHeader(code int) {
	w.Header().Del("Content-Length")
	w.ResponseWriter.WriteHeader(code)
}

func (w *gzipWriter) Write(b []byte) (int, error) {
	w.Header().Del("Content-Length")
	return w.gz.Write(b)
}

func (w *gzipWriter) WriteString(s string) (int, error) {
	w.Header().Del("Content-Length")
	return w.gz.Write([]byte(s))
}

func Gzip() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !strings.Contains(c.GetHeader("Accept-Encoding"), "gzip") ||
			c.Writer.Header().Get("Content-Encoding") != "" ||
			skipCompression(c.Request.URL.Path) {
			c.Next()
			return
		}

		c.Header("Content-Encoding", "gzip")
		addVary(c, "Accept-Encoding")

		gz := gzipPool.Get().(*gzip.Writer)
		gz.Reset(c.Writer)
		defer func() {
			_ = gz.Close()
			gzipPool.Put(gz)
		}()

		c.Writer = &gzipWriter{ResponseWriter: c.Writer, gz: gz}
		c.Next()
	}
}
