package utils

import (
	"testing"
	"time"
)

func TestHashAndCheckPassword(t *testing.T) {
	hash, err := HashPassword("rahasia-kuat")
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}
	if hash == "" {
		t.Fatal("expected non-empty hash")
	}
	if !CheckPassword(hash, "rahasia-kuat") {
		t.Fatal("expected CheckPassword to return true")
	}
	if CheckPassword(hash, "salah") {
		t.Fatal("expected CheckPassword to return false for wrong password")
	}
}

func TestGenerateAndParseJWT(t *testing.T) {
	secret := "test-secret"
	token, err := GenerateJWT(secret, time.Hour, 7, "admin@example.com", "admin")
	if err != nil {
		t.Fatalf("GenerateJWT returned error: %v", err)
	}

	claims, err := ParseJWT(secret, token)
	if err != nil {
		t.Fatalf("ParseJWT returned error: %v", err)
	}
	if claims.UserID != 7 || claims.Email != "admin@example.com" || claims.Role != "admin" {
		t.Fatalf("unexpected claims: %+v", claims)
	}
}

func TestParseJWTRejectsWrongSecret(t *testing.T) {
	token, err := GenerateJWT("right-secret", time.Hour, 1, "a@b.c", "admin")
	if err != nil {
		t.Fatalf("GenerateJWT returned error: %v", err)
	}
	if _, err := ParseJWT("wrong-secret", token); err == nil {
		t.Fatal("expected error for wrong secret")
	}
}
