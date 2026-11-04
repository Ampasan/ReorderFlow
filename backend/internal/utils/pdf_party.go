package utils

import (
	"strings"

	"github.com/jung-kurt/gofpdf"
)

func drawPDFPartyBoxes(pdf *gofpdf.Fpdf, doc PODocument) {
	colW := (pdfContentWidth - 6.0) / 2.0

	pdf.SetDrawColor(203, 213, 225)
	pdf.SetFillColor(248, 250, 252)
	pdf.Rect(pdfMarginLeft, pdfPartyBoxY, colW, pdfPartyBoxH, "DF")

	pdf.SetXY(pdfMarginLeft, pdfPartyBoxY)
	pdf.SetFillColor(241, 245, 249)
	pdf.SetFont("Helvetica", "B", 8)
	pdf.SetTextColor(71, 85, 105)
	pdf.CellFormat(colW, 5.5, "  KEPADA YTH. (PEMASOK / VENDOR)", "B", 1, "L", true, 0, "")

	pdf.SetX(pdfMarginLeft + 2.5)
	pdf.SetFont("Helvetica", "B", 9.5)
	pdf.SetTextColor(15, 23, 42)
	pemasokNama := doc.PemasokNama
	if strings.TrimSpace(pemasokNama) == "" {
		pemasokNama = "-"
	}
	pdf.CellFormat(colW-5, 5.5, pemasokNama, "", 1, "L", false, 0, "")

	pdf.SetX(pdfMarginLeft + 2.5)
	pdf.SetFont("Helvetica", "", 8)
	pdf.SetTextColor(71, 85, 105)
	pemasokEmail := doc.PemasokEmail
	if strings.TrimSpace(pemasokEmail) == "" {
		pemasokEmail = "Email belum terdaftar"
	}
	pdf.CellFormat(colW-5, 4.5, "Email: "+pemasokEmail, "", 1, "L", false, 0, "")

	pdf.SetX(pdfMarginLeft + 2.5)
	pdf.SetFont("Helvetica", "I", 7.5)
	pdf.SetTextColor(100, 116, 139)
	pdf.CellFormat(colW-5, 4.5, "Kemitraan Resmi Mitra Sembako", "", 1, "L", false, 0, "")

	col2X := pdfMarginLeft + colW + 6.0
	pdf.SetDrawColor(203, 213, 225)
	pdf.SetFillColor(248, 250, 252)
	pdf.Rect(col2X, pdfPartyBoxY, colW, pdfPartyBoxH, "DF")

	pdf.SetXY(col2X, pdfPartyBoxY)
	pdf.SetFillColor(241, 245, 249)
	pdf.SetFont("Helvetica", "B", 8)
	pdf.SetTextColor(71, 85, 105)
	pdf.CellFormat(colW, 5.5, "  LOKASI PENGIRIMAN & PENERIMAAN (SHIP TO)", "B", 1, "L", true, 0, "")

	pdf.SetX(col2X + 2.5)
	pdf.SetFont("Helvetica", "B", 9.5)
	pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(colW-5, 5.5, "Gudang Utama Mitra Sembako", "", 1, "L", false, 0, "")

	pdf.SetX(col2X + 2.5)
	pdf.SetFont("Helvetica", "", 8)
	pdf.SetTextColor(71, 85, 105)
	pdf.CellFormat(colW-5, 4.5, "Komplek Pergudangan Induk Blok C-12, Kramat Jati", "", 1, "L", false, 0, "")

	pdf.SetX(col2X + 2.5)
	pdf.SetFont("Helvetica", "", 7.5)
	pdf.SetTextColor(100, 116, 139)
	pdf.CellFormat(colW-5, 4.5, "Up. Bagian Gudang  |  Jadwal: 08.00 - 16.00 WIB", "", 1, "L", false, 0, "")
}
