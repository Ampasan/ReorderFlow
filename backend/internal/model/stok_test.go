package model

import "testing"

func TestStokStatus_Normal(t *testing.T) {
	s := Stok{StokSaatIni: 50, ReorderPoint: 20, QtyMinOrder: 10}
	if got := s.Status(); got != StockStatusNormal {
		t.Errorf("Status() = %q, want %q", got, StockStatusNormal)
	}
}

func TestStokStatus_LowStock(t *testing.T) {
	cases := []struct {
		name         string
		stokSaatIni  int
		reorderPoint int
	}{
		{"tepat di reorder point", 20, 20},
		{"di bawah reorder point", 5, 20},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			s := Stok{StokSaatIni: tc.stokSaatIni, ReorderPoint: tc.reorderPoint, QtyMinOrder: 10}
			if got := s.Status(); got != StockStatusLowStock {
				t.Errorf("Status() = %q, want %q", got, StockStatusLowStock)
			}
		})
	}
}

func TestStokStatus_ManualReview(t *testing.T) {
	cases := []struct {
		name         string
		stok         Stok
	}{
		{"stok negatif", Stok{StokSaatIni: -1, ReorderPoint: 10, QtyMinOrder: 5}},
		{"reorder point nol", Stok{StokSaatIni: 10, ReorderPoint: 0, QtyMinOrder: 5}},
		{"qty min order nol", Stok{StokSaatIni: 10, ReorderPoint: 5, QtyMinOrder: 0}},
		{"semua nol", Stok{StokSaatIni: 0, ReorderPoint: 0, QtyMinOrder: 0}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := tc.stok.Status(); got != StockStatusManualReview {
				t.Errorf("Status() = %q, want %q", got, StockStatusManualReview)
			}
		})
	}
}

func TestStokStatus_LowStockWhenStokIsZeroWithValidConfig(t *testing.T) {
	s := Stok{StokSaatIni: 0, ReorderPoint: 5, QtyMinOrder: 1}
	if got := s.Status(); got != StockStatusLowStock {
		t.Errorf("Status() = %q, want %q", got, StockStatusLowStock)
	}
}

func TestPOStatusConstants(t *testing.T) {
	constants := map[string]string{
		"DRAFT":                  POStatusDraft,
		"PENDING_APPROVAL":       POStatusPendingApproval,
		"SENT":                   POStatusSent,
		"REJECTED":               POStatusRejected,
		"REQUIRES_MANUAL_REVIEW": POStatusManualReview,
		"PARTIALLY_RECEIVED":     POStatusPartiallyReceived,
		"RECEIVED":               POStatusReceived,
	}
	for expected, got := range constants {
		if got != expected {
			t.Errorf("constant mismatch: got %q, want %q", got, expected)
		}
	}
}

func TestStokTableName(t *testing.T) {
	s := Stok{}
	if s.TableName() != "stok" {
		t.Errorf("TableName() = %q, want %q", s.TableName(), "stok")
	}
}

func TestPOLogTableName(t *testing.T) {
	p := POLog{}
	if p.TableName() != "po_log" {
		t.Errorf("TableName() = %q, want %q", p.TableName(), "po_log")
	}
}

func TestPODetailTableName(t *testing.T) {
	d := PODetail{}
	if d.TableName() != "po_detail" {
		t.Errorf("TableName() = %q, want %q", d.TableName(), "po_detail")
	}
}
