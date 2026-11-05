package utils

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const (
	resendAPIURL      = "https://api.resend.com/emails"
	defaultResendFrom = "ReorderFlow <onboarding@resend.dev>"
)

type ResendSender struct {
	apiKey   string
	from     string
	endpoint string
	client   *http.Client
}

type resendAttachment struct {
	Filename string `json:"filename"`
	Content  string `json:"content"`
}

type resendPayload struct {
	From        string             `json:"from"`
	To          []string           `json:"to"`
	Subject     string             `json:"subject"`
	HTML        string             `json:"html"`
	Attachments []resendAttachment `json:"attachments,omitempty"`
}

func NewResendSender(apiKey, from string) *ResendSender {
	from = strings.TrimSpace(from)
	if from == "" {
		from = defaultResendFrom
	}
	return &ResendSender{
		apiKey:   strings.TrimSpace(apiKey),
		from:     from,
		endpoint: resendAPIURL,
		client:   &http.Client{Timeout: 20 * time.Second},
	}
}

func (s *ResendSender) Send(to, subject, htmlBody string) error {
	return s.send(to, subject, htmlBody, "", nil)
}

func (s *ResendSender) SendWithAttachment(to, subject, htmlBody, filename string, attachment []byte) error {
	return s.send(to, subject, htmlBody, filename, attachment)
}

func (s *ResendSender) send(to, subject, htmlBody, filename string, attachment []byte) error {
	to = strings.TrimSpace(to)
	if to == "" {
		return &permanentEmailError{errors.New("alamat email tujuan kosong")}
	}

	payload := resendPayload{
		From:    s.from,
		To:      []string{to},
		Subject: subject,
		HTML:    htmlBody,
	}
	if len(attachment) > 0 {
		payload.Attachments = []resendAttachment{{
			Filename: filename,
			Content:  base64.StdEncoding.EncodeToString(attachment),
		}}
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("resend payload: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, s.endpoint, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("resend request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("resend send: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}

	detail, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
	apiErr := fmt.Errorf("resend status %d: %s", resp.StatusCode, strings.TrimSpace(string(detail)))
	if resp.StatusCode >= 400 && resp.StatusCode < 500 && resp.StatusCode != http.StatusTooManyRequests {
		return &permanentEmailError{apiErr}
	}
	return apiErr
}
