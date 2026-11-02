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
		NomorPO:      "PO-20261102-101-001",
		Tanggal:      "02/11/2026",
		PemasokNama:  "PT Pangan Nusantara Raya",
		PemasokEmail: "order@pangannusantara.co.id",
		Items: []PDFItem{
			{SKU: "SKU-BRS-01", Nama: "Beras Premium Pandan Wangi 5kg", Jumlah: 50},
			{SKU: "SKU-MYK-02", Nama: "Minyak Goreng Sawit 2 Liter", Jumlah: 100},
			{SKU: "SKU-GLA-01", Nama: "Gula Pasir Kristal Putih 1kg", Jumlah: 80},
			{SKU: "SKU-TPG-03", Nama: "Tepung Terigu Segitiga 1kg", Jumlah: 40},
			{SKU: "SKU-TLR-01", Nama: "Telur Ayam Ras Grade A (Tray)", Jumlah: 30},
		},
		TotalQty: 300,
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

func TestGenerateFinalPO(t *testing.T) {
	doc := PODocument{
		NomorPO:      "PO-20261027-101-001",
		Tanggal:      "27/10/2026",
		PemasokNama:  "PT Kopi Nusantara",
		PemasokEmail: "supplier@example.com",
		Items: []PDFItem{
			{SKU: "SKU-KOP-01", Nama: "Kopi Arabika 250g", Jumlah: 20},
		},
		TotalQty: 20,
		Final:    true,
	}

	data, err := GeneratePO(doc)
	if err != nil {
		t.Fatalf("GeneratePO returned error: %v", err)
	}
	if len(data) == 0 || string(data[:4]) != "%PDF" {
		t.Fatal("expected a valid PDF")
	}
}
