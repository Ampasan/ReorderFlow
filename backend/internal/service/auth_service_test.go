package service

import (
	"errors"
	"testing"
	"time"

	"gorm.io/gorm"

	"reorderflow-backend/internal/model"
	"reorderflow-backend/internal/utils"
)

// ─── Mock repository ────────────────────────────────────────────────────────

type mockUserRepo struct {
	users  map[string]*model.User
	nextID int64
}

func newMockUserRepo() *mockUserRepo {
	return &mockUserRepo{
		users:  make(map[string]*model.User),
		nextID: 1,
	}
}

func (m *mockUserRepo) GetByEmail(email string) (*model.User, error) {
	u, ok := m.users[email]
	if !ok {
		return nil, gorm.ErrRecordNotFound
	}
	return u, nil
}

func (m *mockUserRepo) Create(user *model.User) error {
	user.ID = m.nextID
	m.nextID++
	m.users[user.Email] = user
	return nil
}

func (m *mockUserRepo) Update(user *model.User) error {
	m.users[user.Email] = user
	return nil
}

func (m *mockUserRepo) GetByID(id int64) (*model.User, error) {
	for _, u := range m.users {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, gorm.ErrRecordNotFound
}

func newTestAuthService() (*AuthService, *mockUserRepo) {
	repo := newMockUserRepo()
	svc := &AuthService{
		userRepo: nil,
		secret:   "test-secret-32-chars-long-enough!",
		ttl:      24 * time.Hour,
	}
	_ = svc
	return svc, repo
}

// ─── EnsureUser ─────────────────────────────────────────────────────────────

func TestEnsureUser_RejectsShortPassword(t *testing.T) {
	svc, _ := newTestAuthService()
	err := svc.EnsureUser("admin@toko.id", "short", "Andi", model.RoleAdmin)
	if err == nil {
		t.Error("EnsureUser() seharusnya mengembalikan error untuk password < 8 karakter")
	}
}

func TestEnsureUser_RejectsInvalidRole(t *testing.T) {
	svc, _ := newTestAuthService()
	err := svc.EnsureUser("admin@toko.id", "password123", "Andi", "superuser")
	if err == nil {
		t.Error("EnsureUser() seharusnya mengembalikan error untuk role tidak valid")
	}
}

func TestEnsureUser_SkipsWhenEmailOrPasswordEmpty(t *testing.T) {
	svc, _ := newTestAuthService()

	if err := svc.EnsureUser("", "password123", "Andi", model.RoleAdmin); err != nil {
		t.Errorf("EnsureUser() dengan email kosong seharusnya return nil, got: %v", err)
	}
	if err := svc.EnsureUser("admin@toko.id", "", "Andi", model.RoleAdmin); err != nil {
		t.Errorf("EnsureUser() dengan password kosong seharusnya return nil, got: %v", err)
	}
}

// ─── Login ──────────────────────────────────────────────────────────────────

func loginWithMockRepo(email, password, storedEmail, storedPassword, role, secret string) (*model.LoginResponse, error) {
	hash, _ := utils.HashPassword(storedPassword)
	user := &model.User{
		ID:           1,
		Email:        storedEmail,
		PasswordHash: hash,
		Nama:         "Andi Pratama",
		Role:         role,
	}

	var getByEmail func(string) (*model.User, error)
	getByEmail = func(e string) (*model.User, error) {
		if e == storedEmail {
			return user, nil
		}
		return nil, gorm.ErrRecordNotFound
	}

	found, err := getByEmail(email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}
	if !utils.CheckPassword(found.PasswordHash, password) {
		return nil, ErrInvalidCredentials
	}
	token, err := utils.GenerateJWT(secret, 24*time.Hour, found.ID, found.Email, found.Role)
	if err != nil {
		return nil, err
	}
	return &model.LoginResponse{Token: token, User: *found}, nil
}

func TestLogin_Sukses(t *testing.T) {
	res, err := loginWithMockRepo(
		"admin@toko.id", "password123",
		"admin@toko.id", "password123",
		model.RoleAdmin, "test-secret",
	)
	if err != nil {
		t.Fatalf("Login() error = %v, want nil", err)
	}
	if res.Token == "" {
		t.Error("Login() harus mengembalikan token tidak kosong")
	}
	if res.User.Email != "admin@toko.id" {
		t.Errorf("Login() user.Email = %q, want %q", res.User.Email, "admin@toko.id")
	}
}

func TestLogin_PasswordSalah(t *testing.T) {
	_, err := loginWithMockRepo(
		"admin@toko.id", "wrongpassword",
		"admin@toko.id", "password123",
		model.RoleAdmin, "test-secret",
	)
	if !errors.Is(err, ErrInvalidCredentials) {
		t.Errorf("Login() error = %v, want ErrInvalidCredentials", err)
	}
}

func TestLogin_EmailTidakDitemukan(t *testing.T) {
	_, err := loginWithMockRepo(
		"notfound@toko.id", "password123",
		"admin@toko.id", "password123",
		model.RoleAdmin, "test-secret",
	)
	if !errors.Is(err, ErrInvalidCredentials) {
		t.Errorf("Login() error = %v, want ErrInvalidCredentials", err)
	}
}

func TestLogin_TokenMengandungUserID(t *testing.T) {
	res, err := loginWithMockRepo(
		"admin@toko.id", "password123",
		"admin@toko.id", "password123",
		model.RoleAdmin, "my-test-secret",
	)
	if err != nil {
		t.Fatalf("Login() error = %v", err)
	}
	claims, err := utils.ParseJWT("my-test-secret", res.Token)
	if err != nil {
		t.Fatalf("ParseJWT() error = %v", err)
	}
	if claims.Role != model.RoleAdmin {
		t.Errorf("JWT role = %v, want %q", claims.Role, model.RoleAdmin)
	}
	if claims.UserID != 1 {
		t.Errorf("JWT user_id = %v, want 1", claims.UserID)
	}
}

func TestLogin_PasswordHashTidakDieksposeKeLuar(t *testing.T) {
	res, err := loginWithMockRepo(
		"admin@toko.id", "password123",
		"admin@toko.id", "password123",
		model.RoleAdmin, "test-secret",
	)
	if err != nil {
		t.Fatalf("Login() error = %v", err)
	}
	plainPassword := "password123"
	if utils.CheckPassword(res.User.PasswordHash, plainPassword) {
		if len(res.User.PasswordHash) < 10 {
			t.Error("PasswordHash harus berupa hash bcrypt yang valid")
		}
	}
}
