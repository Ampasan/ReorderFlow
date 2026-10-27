package utils

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type SupabaseStorage struct {
	baseURL    string
	serviceKey string
	bucket     string
	client     *http.Client
}

func NewSupabaseStorage(baseURL, serviceKey, bucket string) *SupabaseStorage {
	return &SupabaseStorage{
		baseURL:    strings.TrimRight(baseURL, "/"),
		serviceKey: serviceKey,
		bucket:     bucket,
		client:     &http.Client{Timeout: 20 * time.Second},
	}
}

func (s *SupabaseStorage) Upload(path string, data []byte, contentType string) (string, error) {
	endpoint := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.baseURL, s.bucket, url.PathEscape(path))

	req, err := http.NewRequest(http.MethodPost, endpoint, bytes.NewReader(data))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+s.serviceKey)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("x-upsert", "true")

	resp, err := s.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return "", fmt.Errorf("storage upload failed with status %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	return s.PublicURL(path), nil
}

func (s *SupabaseStorage) Download(objectURL string) ([]byte, error) {
	req, err := http.NewRequest(http.MethodGet, objectURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+s.serviceKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("storage download failed with status %d", resp.StatusCode)
	}
	return io.ReadAll(resp.Body)
}

func (s *SupabaseStorage) PublicURL(path string) string {
	return fmt.Sprintf("%s/storage/v1/object/public/%s/%s", s.baseURL, s.bucket, url.PathEscape(path))
}
