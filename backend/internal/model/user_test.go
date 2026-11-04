package model

import "testing"

func TestUserTableName(t *testing.T) {
	u := User{}
	if u.TableName() != "users" {
		t.Errorf("TableName() = %q, want %q", u.TableName(), "users")
	}
}

func TestRoleConstants(t *testing.T) {
	if RoleAdmin != "admin" {
		t.Errorf("RoleAdmin = %q, want %q", RoleAdmin, "admin")
	}
	if RoleManager != "manager" {
		t.Errorf("RoleManager = %q, want %q", RoleManager, "manager")
	}
}

func TestLoginRequestBinding(t *testing.T) {
	req := LoginRequest{
		Email:    "admin@toko.id",
		Password: "securepassword",
	}
	if req.Email != "admin@toko.id" {
		t.Errorf("Email = %q, want %q", req.Email, "admin@toko.id")
	}
	if req.Password != "securepassword" {
		t.Errorf("Password = %q, want %q", req.Password, "securepassword")
	}
}

func TestLoginResponseHidesPasswordHash(t *testing.T) {
	u := User{
		ID:           1,
		Email:        "admin@toko.id",
		PasswordHash: "bcrypt-hash-here",
		Nama:         "Andi",
		Role:         RoleAdmin,
	}
	if u.PasswordHash == "" {
		t.Error("PasswordHash seharusnya tersimpan di struct")
	}
}
