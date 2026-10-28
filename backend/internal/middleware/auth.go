package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"reorderflow-backend/internal/utils"
)

func Auth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := parseBearerToken(c)
		if tokenString == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Token otentikasi diperlukan",
				"data":    nil,
				"error":   "missing bearer token",
			})
			return
		}

		claims, err := utils.ParseJWT(secret, tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Token tidak valid atau sudah kedaluwarsa",
				"data":    nil,
				"error":   "invalid or expired token",
			})
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)
		c.Next()
	}
}

func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(roles))
	for _, role := range roles {
		allowed[role] = struct{}{}
	}

	return func(c *gin.Context) {
		role, _ := c.Get("user_role")
		roleName, _ := role.(string)
		if _, ok := allowed[roleName]; !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Anda tidak memiliki akses untuk aksi ini",
				"data":    nil,
				"error":   "insufficient role",
			})
			return
		}
		c.Next()
	}
}

func parseBearerToken(c *gin.Context) string {
	auth := c.GetHeader("Authorization")
	if auth == "" {
		return ""
	}
	parts := strings.SplitN(auth, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return strings.TrimSpace(parts[1])
}
