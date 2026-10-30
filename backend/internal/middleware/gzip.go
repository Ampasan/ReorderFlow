package middleware

import (
	"compress/gzip"
	"io"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
)

var gzipPool = sync.Pool{
	New: func() interface{} {
		// BestSpeed keeps CPU cost low; API payloads here are small JSON lists.
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

func (w *gzipWriter) Write(b []byte) (int, error) {
	return w.gz.Write(b)
}

func (w *gzipWriter) WriteString(s string) (int, error) {
	return w.gz.Write([]byte(s))
}

func Gzip() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !strings.Contains(c.GetHeader("Accept-Encoding"), "gzip") ||
			c.Writer.Header().Get("Content-Encoding") != "" {
			c.Next()
			return
		}

		c.Header("Content-Encoding", "gzip")
		c.Header("Vary", "Accept-Encoding")

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
