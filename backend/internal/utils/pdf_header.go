package utils

import (
	"bytes"

	"github.com/jung-kurt/gofpdf"
)

// drawPDFHeader menggambar kop surat perusahaan dan blok identitas dokumen PO.
func drawPDFHeader(pdf *gofpdf.Fpdf, doc PODocument, logo []byte) {
	// Daftarkan dan cetak logo UMKM jika bytes tersedia
	logoW := 25.0
	hasLogo := len(logo) > 0
	if hasLogo {
		opt := gofpdf.ImageOptions{
			ImageType: "PNG",
			ReadDpi:   true,
		}
		pdf.RegisterImageOptionsReader("logo_umkm", opt, bytes.NewReader(logo))
		if pdf.Error() == nil {
			pdf.ImageOptions("logo_umkm", pdfMarginLeft, 12, logoW, 0, false, opt, 0, "")
		}
	}

	// Identitas UMKM Mitra Sembako di sebelah kanan logo
	infoX := pdfMarginLeft
	if hasLogo {
		infoX = pdfMarginLeft + logoW + 4.0
	}

	pdf.SetXY(infoX, 12)
	pdf.SetFont("Helvetica", "B", 15)
	pdf.SetTextColor(15, 23, 42) // Slate 900
	pdf.CellFormat(85, 6, "MITRA SEMBAKO", "", 2, "L", false, 0, "")

	pdf.SetFont("Helvetica", "B", 8)
	pdf.SetTextColor(71, 85, 105) // Slate 600
	pdf.CellFormat(85, 4.5, "Pusat Grosir & Distribusi Bahan Pokok Sembako", "", 2, "L", false, 0, "")

	pdf.SetFont("Helvetica", "", 7.5)
	pdf.SetTextColor(100, 116, 139) // Slate 500
	pdf.CellFormat(85, 3.8, "Jl. Raya Pasar Induk No. 88, Kramat Jati, Jakarta Timur 13540", "", 2, "L", false, 0, "")
	pdf.CellFormat(85, 3.8, "Telp: (021) 8779-1234  |  WhatsApp: 0812-9876-5432", "", 2, "L", false, 0, "")
	pdf.CellFormat(85, 3.8, "Email: purchasing@mitrasembako.id", "", 2, "L", false, 0, "")

	// Blok Dokumen PO di sisi kanan atas
	boxW := 65.0
	boxX := pdfPageWidth - pdfMarginRight - boxW
	pdf.SetXY(boxX, 11)

	pdf.SetFont("Helvetica", "B", 16)
	pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(boxW, 6.5, "PURCHASE ORDER", "", 2, "R", false, 0, "")

	pdf.SetFont("Helvetica", "B", 8)
	pdf.SetTextColor(100, 116, 139)
	pdf.CellFormat(boxW, 4, "SURAT PESANAN PEMBELIAN", "", 2, "R", false, 0, "")

	pdf.SetXY(boxX, pdf.GetY()+1)
	pdf.SetFont("Helvetica", "B", 8.5)
	pdf.SetTextColor(51, 65, 85)
	pdf.CellFormat(24, 4.5, "No. PO", "", 0, "L", false, 0, "")
	pdf.SetFont("Helvetica", "B", 8.5)
	pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(boxW-24, 4.5, ": "+doc.NomorPO, "", 1, "R", false, 0, "")

	pdf.SetX(boxX)
	pdf.SetFont("Helvetica", "", 8.5)
	pdf.SetTextColor(51, 65, 85)
	pdf.CellFormat(24, 4.5, "Tanggal", "", 0, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 8.5)
	pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(boxW-24, 4.5, ": "+doc.Tanggal, "", 1, "R", false, 0, "")

	// Status Dokumen (Resmi / Draf)
	pdf.SetX(boxX)
	pdf.SetFont("Helvetica", "", 8.5)
	pdf.SetTextColor(51, 65, 85)
	pdf.CellFormat(24, 5, "Status", "", 0, "L", false, 0, "")

	if doc.Final {
		pdf.SetFillColor(240, 253, 244) // Emerald 50
		pdf.SetDrawColor(34, 197, 94)   // Emerald 500
		pdf.SetTextColor(21, 128, 61)   // Emerald 700
		pdf.SetFont("Helvetica", "B", 7.5)
		pdf.CellFormat(boxW-24, 5, "APPROVED (RESMI)", "1", 1, "C", true, 0, "")
	} else {
		pdf.SetFillColor(254, 243, 199) // Amber 100
		pdf.SetDrawColor(245, 158, 11)  // Amber 500
		pdf.SetTextColor(180, 83, 9)    // Amber 700
		pdf.SetFont("Helvetica", "B", 7.5)
		pdf.CellFormat(boxW-24, 5, "DRAFT PESANAN", "1", 1, "C", true, 0, "")
	}

	// Garis Ganda Pembatas Kop Surat (Formal Corporate Header Line)
	pdf.SetLineWidth(0.8)
	pdf.SetDrawColor(30, 41, 59) // Slate 800
	pdf.Line(pdfMarginLeft, 38, pdfPageWidth-pdfMarginRight, 38)

	pdf.SetLineWidth(0.2)
	pdf.SetDrawColor(148, 163, 184) // Slate 400
	pdf.Line(pdfMarginLeft, 39.2, pdfPageWidth-pdfMarginRight, 39.2)
}
