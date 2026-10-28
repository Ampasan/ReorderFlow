package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"reorderflow-backend/internal/model"
	"reorderflow-backend/internal/service"
)

type AuthHandler struct {
	auth     *service.AuthService
	userRepo interface {
		GetByID(id int64) (*model.User, error)
	}
}

func NewAuthHandler(auth *service.AuthService, userRepo interface {
	GetByID(id int64) (*model.User, error)
}) *AuthHandler {
	return &AuthHandler{auth: auth, userRepo: userRepo}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req model.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, http.StatusBadRequest, "Email dan password wajib diisi dengan format benar", err.Error())
		return
	}

	res, err := h.auth.Login(req.Email, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			Error(c, http.StatusUnauthorized, "Email atau password salah", err.Error())
			return
		}
		Error(c, http.StatusInternalServerError, "Gagal memproses login", nil)
		return
	}

	Success(c, http.StatusOK, "Login berhasil", res)
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		Error(c, http.StatusUnauthorized, "Token tidak valid", "user_id not found")
		return
	}

	user, err := h.userRepo.GetByID(userID.(int64))
	if err != nil {
		Error(c, http.StatusUnauthorized, "Pengguna tidak ditemukan", nil)
		return
	}

	Success(c, http.StatusOK, "Berhasil mengambil data pengguna", user)
}
