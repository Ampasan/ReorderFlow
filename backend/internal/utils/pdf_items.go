package utils

import (
	"fmt"

	"github.com/jung-kurt/gofpdf"
)

// drawPDFItemsTable menggambar tabel barang dan baris total kuantitas.
func drawPDFItemsTable(pdf *gofpdf.Fpdf, doc PODocument) {
	tableY := pdfPartyBoxY + pdfPartyBoxH + 5.0
	pdf.SetXY(pdfMarginLeft, tableY)

	// Dimensi Kolom: Total 182 mm
	colNoW := 10.0
	colSkuW := 36.0
	colNamaW := 96.0
	colQtyW := 22.0
	colSatuanW := 18.0

	// Header Tabel (Corporate Dark Slate)
	pdf.SetLineWidth(0.2)
	pdf.SetDrawColor(51, 65, 85)
	pdf.SetFillColor(30, 41, 59) // Slate 800
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Helvetica", "B", 8)

	headerH := 7.5
	pdf.CellFormat(colNoW, headerH, "NO", "1", 0, "C", true, 0, "")
	pdf.CellFormat(colSkuW, headerH, "KODE SKU", "1", 0, "C", true, 0, "")
	pdf.CellFormat(colNamaW, headerH, "DESKRIPSI / NAMA BARANG", "1", 0, "L", true, 0, "")
	pdf.CellFormat(colQtyW, headerH, "JUMLAH", "1", 0, "C", true, 0, "")
	pdf.CellFormat(colSatuanW, headerH, "SATUAN", "1", 1, "C", true, 0, "")

	// Baris Tabel
	rowH := 7.0
	pdf.SetFont("Helvetica", "", 8.5)
	pdf.SetDrawColor(226, 232, 240) // Slate 200

	for i, item := range doc.Items {
		// Alternating Row Colors
		if i%2 == 1 {
			pdf.SetFillColor(248, 250, 252) // Slate 50
		} else {
			pdf.SetFillColor(255, 255, 255)
		}

		pdf.SetTextColor(100, 116, 139)
		pdf.CellFormat(colNoW, rowH, fmt.Sprintf("%d", i+1), "1", 0, "C", true, 0, "")

		pdf.SetTextColor(15, 23, 42)
		pdf.SetFont("Helvetica", "B", 8)
		pdf.CellFormat(colSkuW, rowH, item.SKU, "1", 0, "C", true, 0, "")

		pdf.SetFont("Helvetica", "", 8.5)
		pdf.SetTextColor(15, 23, 42)
		// Nama barang dengan sedikit padding kiri
		pdf.CellFormat(colNamaW, rowH, " "+item.Nama, "1", 0, "L", true, 0, "")

		pdf.SetFont("Helvetica", "B", 8.5)
		pdf.SetTextColor(15, 23, 42)
		pdf.CellFormat(colQtyW, rowH, fmt.Sprintf("%d ", item.Jumlah), "1", 0, "R", true, 0, "")

		pdf.SetFont("Helvetica", "", 8)
		pdf.SetTextColor(71, 85, 105)
		pdf.CellFormat(colSatuanW, rowH, "Unit", "1", 1, "C", true, 0, "")
	}

	// Baris Total
	totalSpanW := colNoW + colSkuW + colNamaW // 142 mm
	totalValW := colQtyW + colSatuanW         // 40 mm

	pdf.SetFillColor(241, 245, 249) // Slate 100
	pdf.SetDrawColor(203, 213, 225)
	pdf.SetTextColor(15, 23, 42)
	pdf.SetFont("Helvetica", "B", 8.5)

	pdf.CellFormat(totalSpanW, 7.5, "TOTAL KUANTITAS PESANAN  ", "1", 0, "R", true, 0, "")
	pdf.CellFormat(totalValW, 7.5, fmt.Sprintf("%d Unit", doc.TotalQty), "1", 1, "C", true, 0, "")
}
