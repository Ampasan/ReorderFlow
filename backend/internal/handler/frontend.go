package handler

import (
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

const indexFileName = "index.html"

func RegisterFrontend(router *gin.Engine, distDir string) {
	if distDir == "" {
		return
	}

	absDir, err := filepath.Abs(distDir)
	if err != nil {
		return
	}
	indexPath := filepath.Join(absDir, indexFileName)
	if info, err := os.Stat(indexPath); err != nil || info.IsDir() {
		return
	}

	router.NoRoute(func(c *gin.Context) {
		requestPath := path.Clean(c.Request.URL.Path)

		if requestPath == "/api" || strings.HasPrefix(requestPath, "/api/") {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Endpoint tidak ditemukan",
				"data":    nil,
			})
			return
		}

		filePath := filepath.Join(absDir, filepath.FromSlash(strings.TrimPrefix(requestPath, "/")))
		if !withinDir(absDir, filePath) {
			c.Status(http.StatusNotFound)
			return
		}

		if info, err := os.Stat(filePath); err == nil && !info.IsDir() {
			c.Header("Cache-Control", staticCacheControl(requestPath))
			c.File(filePath)
			return
		}

		c.Header("Cache-Control", "no-cache")
		c.File(indexPath)
	})
}

func withinDir(dir, target string) bool {
	return target == dir || strings.HasPrefix(target, dir+string(os.PathSeparator))
}

func staticCacheControl(requestPath string) string {
	p := strings.ToLower(requestPath)
	switch {
	case strings.HasPrefix(p, "/assets/"):
		return "public, max-age=31536000, immutable"
	case strings.HasPrefix(p, "/fonts/"):
		return "public, max-age=31536000, immutable"
	case strings.HasSuffix(p, ".html"):
		return "no-cache"
	default:
		return "public, max-age=604800"
	}
}
