package cache

import (
	"testing"
	"time"
)

type dummyData struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

func TestMemoryCacheGetSet(t *testing.T) {
	c := New(nil)

	var result dummyData
	if c.Get("test-key", &result) {
		t.Fatal("expected cache miss for non-existent key")
	}

	payload := dummyData{Name: "Item A", Count: 42}
	c.Set("test-key", payload)

	if !c.Get("test-key", &result) {
		t.Fatal("expected cache hit")
	}
	if result.Name != payload.Name || result.Count != payload.Count {
		t.Fatalf("expected %+v, got %+v", payload, result)
	}
}

func TestMemoryCacheInvalidate(t *testing.T) {
	c := New(nil)

	c.Set(KeyDashboard, dummyData{Name: "dash", Count: 1})
	c.Set(stokPrefix+"all", dummyData{Name: "stock", Count: 2})

	var res dummyData
	if !c.Get(KeyDashboard, &res) {
		t.Fatal("expected dashboard in cache")
	}

	c.Invalidate()

	if c.Get(KeyDashboard, &res) {
		t.Fatal("expected dashboard to be cleared after Invalidate")
	}
	if c.Get(stokPrefix+"all", &res) {
		t.Fatal("expected stock to be cleared after Invalidate")
	}
}

func TestMemoryCacheExpiration(t *testing.T) {
	c := New(nil)
	c.items["expired-key"] = memoryEntry{
		raw:       []byte(`{"name":"old","count":0}`),
		expiresAt: time.Now().Add(-1 * time.Second),
	}

	var res dummyData
	if c.Get("expired-key", &res) {
		t.Fatal("expected expired key to not be returned")
	}
}

