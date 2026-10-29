package service

import (
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"reorderflow-backend/internal/model"
	"reorderflow-backend/internal/repository"
	"reorderflow-backend/internal/utils"
)

var ErrInvalidCredentials = errors.New("email atau password salah")

type AuthService struct {
	userRepo *repository.UserRepository
	secret   string
	ttl      time.Duration
}

func NewAuthService(userRepo *repository.UserRepository, secret string, ttl time.Duration) *AuthService {
	return &AuthService{
		userRepo: userRepo,
		secret:   secret,
		ttl:      ttl,
	}
}

func (s *AuthService) Login(email, password string) (*model.LoginResponse, error) {
	user, err := s.userRepo.GetByEmail(strings.TrimSpace(email))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if !utils.CheckPassword(user.PasswordHash, password) {
		return nil, ErrInvalidCredentials
	}

	token, err := utils.GenerateJWT(s.secret, s.ttl, user.ID, user.Email, user.Role)
	if err != nil {
		return nil, err
	}

	return &model.LoginResponse{Token: token, User: *user}, nil
}

func (s *AuthService) EnsureUser(email, password, nama, role string) error {
	if email == "" || password == "" {
		return nil
	}

	if len(password) < 8 {
		return errors.New("password minimal 8 karakter")
	}

	if role != model.RoleAdmin && role != model.RoleManager {
		return errors.New("role tidak valid")
	}

	if nama == "" {
		switch role {
		case model.RoleManager:
			nama = "Operations Manager"
		default:
			nama = "Admin"
		}
	}

	hash, err := utils.HashPassword(password)
	if err != nil {
		return err
	}

	existing, err := s.userRepo.GetByEmail(email)
	if err == nil && existing != nil {
		existing.PasswordHash = hash
		existing.Nama = nama
		existing.Role = role
		return s.userRepo.Update(existing)
	}
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	return s.userRepo.Create(&model.User{
		Email:        strings.ToLower(strings.TrimSpace(email)),
		PasswordHash: hash,
		Nama:         nama,
		Role:         role,
	})
}
