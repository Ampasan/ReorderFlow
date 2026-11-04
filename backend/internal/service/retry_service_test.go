package service

import (
	"context"
	"testing"
	"time"
)

type permanentTestError struct{}

func (permanentTestError) Error() string   { return "permanent" }
func (permanentTestError) Permanent() bool { return true }

func TestRetryStopsOnPermanentError(t *testing.T) {
	attempts := 0
	err := Retry(context.Background(), 3, []time.Duration{0}, func() error {
		attempts++
		return permanentTestError{}
	})

	if attempts != 1 {
		t.Fatalf("expected 1 attempt, got %d", attempts)
	}
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}

func TestRetryRepeatsTransientErrors(t *testing.T) {
	attempts := 0
	err := Retry(context.Background(), 2, []time.Duration{0, 0}, func() error {
		attempts++
		if attempts < 3 {
			return context.DeadlineExceeded
		}
		return nil
	})

	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if attempts != 3 {
		t.Fatalf("expected 3 attempts, got %d", attempts)
	}
}
