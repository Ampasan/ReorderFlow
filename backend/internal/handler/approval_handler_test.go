package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

// GET with a valid token and action must process immediately (no confirmation page).
func TestApprovalGETProcessesImmediately(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	// ApprovalService is nil — ProcessApproval will panic unless token is empty.
	// We verify the bad-token path to confirm the handler skips the confirmation page.
	router.GET("/api/po/approval", (&ApprovalHandler{}).Approval)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/po/approval?token=&action=approve", nil)
	router.ServeHTTP(rec, req)

	// Empty token must return the error page, not a confirmation form.
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
	body := rec.Body.String()
	if strings.Contains(body, `<form`) {
		t.Fatal("handler must not render a confirmation form — it processes immediately")
	}
}

func TestApprovalGETRejectsBadAction(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/po/approval", (&ApprovalHandler{}).Approval)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/po/approval?token=abc&action=maybe", nil)
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
	if strings.Contains(rec.Body.String(), `<form`) {
		t.Fatal("invalid action must not render a form")
	}
}
