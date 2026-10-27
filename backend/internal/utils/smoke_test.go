package utils

import (
	"testing"
)

func TestGenerateToken(t *testing.T) {
	tok, err := GenerateToken()
	if err != nil {
		t.Fatalf("GenerateToken returned error: %v", err)
	}
	if len(tok) != 32 {
		t.Fatalf("expected 32 hex chars, got %d (%s)", len(tok), tok)
	}
}

func TestGeneratePO(t *testing.T) {
	doc := PODocument{
		NomorPO:      "PO-20261027-101-001",
		Tanggal:      "27/10/2026",
		PemasokNama:  "PT Kopi Nusantara",
		PemasokEmail: "supplier@example.com",
		Items: []PDFItem{
			{SKU: "SKU-KOP-01", Nama: "Kopi Arabika 250g", Jumlah: 20},
		},
		TotalQty: 20,
	}

	data, err := GeneratePO(doc)
	if err != nil {
		t.Fatalf("GeneratePO returned error: %v", err)
	}
	if len(data) == 0 {
		t.Fatal("expected non-empty PDF bytes")
	}
	if string(data[:4]) != "%PDF" {
		t.Fatalf("expected PDF header, got %q", string(data[:4]))
	}
}
