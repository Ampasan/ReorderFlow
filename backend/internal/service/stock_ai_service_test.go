package service

import (
	"strings"
	"testing"

	"reorderflow-backend/internal/model"
)

func TestStockInsightPromptIncludesAnonymousItemData(t *testing.T) {
	prompt, err := stockInsightPrompt([]model.Stok{
		{
			SKU:          "SKU-1",
			Nama:         "Beras",
			StokSaatIni:  2,
			ReorderPoint: 5,
			QtyMinOrder:  4,
			IDPemasok:    9,
			Pemasok:      &model.Pemasok{Nama: "Supplier", Email: "private@example.com"},
		},
		{SKU: "SKU-2", StokSaatIni: 5, ReorderPoint: 5},
	})
	if err != nil {
		t.Fatal(err)
	}

	for _, want := range []string{`"id":1`, `"stok":2`, `"rop":5`, `"minimum_order":4`, `"id":2`, `"stok":5`} {
		if !strings.Contains(prompt, want) {
			t.Errorf("prompt does not contain %q", want)
		}
	}
	for _, unwanted := range []string{"SKU-1", "SKU-2", "Beras", "private@example.com", "Supplier", "id_pemasok", "stok_saat_ini"} {
		if strings.Contains(prompt, unwanted) {
			t.Errorf("prompt contains excluded field %q", unwanted)
		}
	}
}

func TestParseStockAnalysisMapsGeminiRecommendationsToStock(t *testing.T) {
	items := []model.Stok{
		{SKU: "SKU-1", Nama: "Beras", StokSaatIni: 2, ReorderPoint: 5},
	}
	content := `{"ringkasan":"Stok berada di bawah ROP dan perlu diperiksa.","rekomendasi":[{"id":1,"prioritas":"TINGGI","alasan":"Stok jauh di bawah batas ROP."}]}`

	got, err := parseStockAnalysis(items, content)
	if err != nil {
		t.Fatal(err)
	}
	if got.ItemCount != 1 || got.Explanation != "Stok berada di bawah ROP dan perlu diperiksa." {
		t.Fatalf("unexpected summary: %#v", got)
	}
	if len(got.Items) != 1 || got.Items[0].SKU != "SKU-1" ||
		got.Items[0].Prioritas != model.StockPriorityHigh ||
		got.Items[0].Alasan != "Stok jauh di bawah batas ROP." {
		t.Fatalf("unexpected item analysis: %#v", got.Items)
	}

	for _, invalid := range []string{
		`{"ringkasan":"","rekomendasi":[]}`,
		`{"ringkasan":"valid","rekomendasi":[]}`,
		`{"ringkasan":"valid","rekomendasi":[{"id":1,"prioritas":"kritis","alasan":"invalid"}]}`,
	} {
		if _, err := parseStockAnalysis(items, invalid); err == nil {
			t.Errorf("parseStockAnalysis(%s) expected an error", invalid)
		}
	}
}

func TestParseStockAnalysisAcceptsAIResultWithNoLowStockItems(t *testing.T) {
	got, err := parseStockAnalysis(nil, `{"ringkasan":"Tidak ada barang yang mencapai ROP.","rekomendasi":[]}`)
	if err != nil {
		t.Fatal(err)
	}
	if got.ItemCount != 0 || got.Explanation != "Tidak ada barang yang mencapai ROP." || len(got.Items) != 0 {
		t.Fatalf("unexpected empty analysis: %#v", got)
	}
}

func TestStockRecommendationPromptOmitsStockIdentifiers(t *testing.T) {
	prompt, err := stockRecommendationPrompt([]model.Stok{
		{
			SKU:          "SECRET-SKU",
			Nama:         "Produk Rahasia",
			StokSaatIni:  2,
			ReorderPoint: 5,
			QtyMinOrder:  4,
			IDPemasok:    9,
			Pemasok:      &model.Pemasok{Nama: "Supplier Rahasia"},
		},
	})
	if err != nil {
		t.Fatal(err)
	}

	for _, want := range []string{`"id":1`, `"stok":2`, `"rop":5`, `"minimum_order":4`} {
		if !strings.Contains(prompt, want) {
			t.Errorf("prompt does not contain %q", want)
		}
	}
	for _, unwanted := range []string{"SECRET-SKU", "Produk Rahasia", "Supplier Rahasia", "id_pemasok"} {
		if strings.Contains(prompt, unwanted) {
			t.Errorf("prompt contains excluded field %q", unwanted)
		}
	}
}

func TestParseStockRecommendationsMapsAndValidatesResults(t *testing.T) {
	items := []model.Stok{{SKU: "SKU-1"}, {SKU: "SKU-2"}}
	content := `{"rekomendasi":[{"id":2,"prioritas":"sedang","alasan":"Stok mendekati batas ROP."},{"id":1,"prioritas":"tinggi","alasan":"Stok jauh di bawah batas ROP."}]}`

	got, err := parseStockRecommendations(items, content)
	if err != nil {
		t.Fatal(err)
	}
	if got["SKU-1"].Priority != model.StockPriorityHigh || got["SKU-2"].Priority != model.StockPriorityMedium {
		t.Fatalf("unexpected priorities: %#v", got)
	}

	for _, invalid := range []string{
		`{"rekomendasi":[{"id":1,"prioritas":"tinggi","alasan":"valid"},{"id":1,"prioritas":"sedang","alasan":"duplikat"}]}`,
		`{"rekomendasi":[{"id":1,"prioritas":"kritis","alasan":"tidak valid"},{"id":2,"prioritas":"rendah","alasan":"valid"}]}`,
		`{"rekomendasi":[{"id":1,"prioritas":"tinggi","alasan":""},{"id":2,"prioritas":"rendah","alasan":"valid"}]}`,
		`{"rekomendasi":[{"id":1,"prioritas":"tinggi","alasan":"valid"}]}`,
	} {
		if _, err := parseStockRecommendations(items, invalid); err == nil {
			t.Errorf("parseStockRecommendations(%s) expected an error", invalid)
		}
	}
}
