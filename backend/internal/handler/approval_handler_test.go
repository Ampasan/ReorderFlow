package handler

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestApprovalGETRequiresExplicitPOSTConfirmation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/po/approval", (&ApprovalHandler{}).Approval)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/po/approval?token=sample-token&action=approve", nil)
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	body := rec.Body.String()
	if !strings.Contains(body, `<form method="post" action="/api/po/approval">`) {
		t.Fatal("confirmation page must submit the action with POST")
	}
	if !strings.Contains(body, `name="token" value="sample-token"`) ||
		!strings.Contains(body, `name="action" value="approve"`) {
		t.Fatal("confirmation form is missing its action data")
	}
}

func TestApprovalConfirmationEscapesToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/api/po/approval", (&ApprovalHandler{}).Approval)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/po/approval?token=%3Cscript%3E&action=approve", nil)
	router.ServeHTTP(rec, req)

	if strings.Contains(rec.Body.String(), "<script>") ||
		!strings.Contains(rec.Body.String(), "&lt;script&gt;") {
		t.Fatal("confirmation page must escape the token value")
	}
}
