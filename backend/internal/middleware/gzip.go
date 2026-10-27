package middleware

import (
	"compress/gzip"
	"strings"

	"github.com/gin-gonic/gin"
)

type gzipWriter struct {
	gin.ResponseWriter
	gz *gzip.Writer
}

func (w *gzipWriter) Write(b []byte) (int, error) {
	return w.gz.Write(b)
}

func (w *gzipWriter) WriteString(s string) (int, error) {
	return w.gz.Write([]byte(s))
}

func Gzip() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !strings.Contains(c.GetHeader("Accept-Encoding"), "gzip") {
			c.Next()
			return
		}

		c.Header("Content-Encoding", "gzip")
		c.Header("Vary", "Accept-Encoding")

		gz := gzip.NewWriter(c.Writer)
		c.Writer = &gzipWriter{ResponseWriter: c.Writer, gz: gz}

		c.Next()

		_ = gz.Close()
	}
}
