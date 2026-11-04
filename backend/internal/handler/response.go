package handler

import (
	"github.com/gin-gonic/gin"

	"reorderflow-backend/internal/utils"
)

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
	Error   interface{} `json:"error,omitempty"`
}

func Success(c *gin.Context, status int, message string, data interface{}) {
	c.JSON(status, Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func Error(c *gin.Context, status int, message string, err interface{}) {
	if status >= 500 && err != nil {
		utils.Logger.Error("request failed", "status", status, "error", err)
		err = "internal server error"
	}

	c.AbortWithStatusJSON(status, Response{
		Success: false,
		Message: message,
		Data:    nil,
		Error:   err,
	})
}
