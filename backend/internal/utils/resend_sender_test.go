package utils

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestResendSenderPostsHTMLWithAttachment(t *testing.T) {
	var got resendPayload
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Errorf("method = %s, want POST", r.Method)
		}
		if auth := r.Header.Get("Authorization"); auth != "Bearer test-key" {
			t.Errorf("authorization = %q", auth)
		}
		if err := json.NewDecoder(r.Body).Decode(&got); err != nil {
			t.Errorf("decode body: %v", err)
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"id":"email-1"}`))
	}))
	defer srv.Close()

	sender := NewResendSender("test-key", "ReorderFlow <noreply@example.com>")
	sender.endpoint = srv.URL

	err := sender.SendWithAttachment("manager@example.com", "Persetujuan PO", "<p>Halo</p>", "PO.pdf", []byte("pdf-bytes"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if got.From != "ReorderFlow <noreply@example.com>" {
		t.Errorf("from = %q", got.From)
	}
	if len(got.To) != 1 || got.To[0] != "manager@example.com" {
		t.Errorf("to = %v", got.To)
	}
	if got.Subject != "Persetujuan PO" || got.HTML != "<p>Halo</p>" {
		t.Errorf("subject/html = %q / %q", got.Subject, got.HTML)
	}
	if len(got.Attachments) != 1 || got.Attachments[0].Filename != "PO.pdf" {
		t.Fatalf("attachments = %+v", got.Attachments)
	}

	decoded, err := base64.StdEncoding.DecodeString(got.Attachments[0].Content)
	if err != nil {
		t.Fatalf("decode attachment: %v", err)
	}
	if string(decoded) != "pdf-bytes" {
		t.Errorf("attachment content = %q", decoded)
	}
}

func TestResendSenderUsesDefaultFrom(t *testing.T) {
	var got resendPayload
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewDecoder(r.Body).Decode(&got)
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	sender := NewResendSender("test-key", "")
	sender.endpoint = srv.URL

	if err := sender.Send("manager@example.com", "Subjek", "<p>Halo</p>"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.From != defaultResendFrom {
		t.Errorf("from = %q, want %q", got.From, defaultResendFrom)
	}
	if len(got.Attachments) != 0 {
		t.Errorf("attachments = %+v, want none", got.Attachments)
	}
}

func TestResendSenderMarksClientErrorPermanent(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnprocessableEntity)
		_, _ = w.Write([]byte(`{"message":"invalid from"}`))
	}))
	defer srv.Close()

	sender := NewResendSender("test-key", "")
	sender.endpoint = srv.URL

	err := sender.Send("manager@example.com", "Subjek", "<p>Halo</p>")
	if err == nil {
		t.Fatal("expected error")
	}
	if !isPermanent(err) {
		t.Fatalf("expected permanent error, got %v", err)
	}
}

func TestResendSenderKeepsRateLimitTransient(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTooManyRequests)
	}))
	defer srv.Close()

	sender := NewResendSender("test-key", "")
	sender.endpoint = srv.URL

	err := sender.Send("manager@example.com", "Subjek", "<p>Halo</p>")
	if err == nil {
		t.Fatal("expected error")
	}
	if isPermanent(err) {
		t.Fatalf("rate limit should stay retryable, got %v", err)
	}
}
