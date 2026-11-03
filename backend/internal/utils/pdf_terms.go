package utils

import "github.com/jung-kurt/gofpdf"

// drawPDFTermsAndSignatures menggambar syarat ketentuan dan blok tanda tangan.
func drawPDFTermsAndSignatures(pdf *gofpdf.Fpdf, doc PODocument) {
	pdf.Ln(4)
	termsY := pdf.GetY()

	termsBoxH := 24.0
	pdf.SetDrawColor(226, 232, 240)
	pdf.SetFillColor(248, 250, 252)
	pdf.Rect(pdfMarginLeft, termsY, pdfContentWidth, termsBoxH, "DF")

	pdf.SetXY(pdfMarginLeft+3, termsY+2)
	pdf.SetFont("Helvetica", "B", 7.5)
	pdf.SetTextColor(51, 65, 85)
	pdf.CellFormat(pdfContentWidth-6, 4, "SYARAT & KETENTUAN PEMESANAN:", "", 1, "L", false, 0, "")

	pdf.SetFont("Helvetica", "", 7)
	pdf.SetTextColor(100, 116, 139)
	pdf.SetX(pdfMarginLeft + 3)
	pdf.CellFormat(pdfContentWidth-6, 3.5, "1. Surat Jalan dan Faktur asli wajib mencantumkan Nomor PO ini dan dilampirkan saat pengiriman fisik.", "", 1, "L", false, 0, "")
	pdf.SetX(pdfMarginLeft + 3)
	pdf.CellFormat(pdfContentWidth-6, 3.5, "2. Barang harus dalam kondisi prima, kemasan utuh, dan tanggal kedaluwarsa (expired date) minimal 12 bulan.", "", 1, "L", false, 0, "")
	pdf.SetX(pdfMarginLeft + 3)
	pdf.CellFormat(pdfContentWidth-6, 3.5, "3. Pemeriksaan mutu dan kuantitas dilakukan oleh bagian logistik gudang saat serah terima barang.", "", 1, "L", false, 0, "")
	pdf.SetX(pdfMarginLeft + 3)
	pdf.CellFormat(pdfContentWidth-6, 3.5, "4. Pembayaran diproses sesuai kesepakatan tempo usaha (Net 30) setelah Berita Acara Penerimaan Barang diverifikasi.", "", 1, "L", false, 0, "")

	// Posisikan blok tanda tangan secara rapi (maks sigY=232 agar tidak melewati footer di Y=270)
	sigY := termsY + termsBoxH + 5.0
	if sigY > 232 {
		sigY = 232
	}

	sigColW := (pdfContentWidth - 12.0) / 3.0 // ~56.6 mm

	// Kolom 1: Dibuat Oleh (Purchasing)
	col1SigX := pdfMarginLeft
	pdf.SetXY(col1SigX, sigY)
	pdf.SetFont("Helvetica", "", 8)
	pdf.SetTextColor(71, 85, 105)
	pdf.CellFormat(sigColW, 4, "Dibuat Oleh,", "", 2, "C", false, 0, "")
	pdf.SetFont("Helvetica", "B", 8)
	pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(sigColW, 4, "Divisi Pengadaan (Purchasing)", "", 2, "C", false, 0, "")
	pdf.Ln(14)
	pdf.SetFont("Helvetica", "", 8)
	pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(sigColW, 4, "( ............................................ )", "", 2, "C", false, 0, "")
	pdf.SetFont("Helvetica", "", 7)
	pdf.SetTextColor(100, 116, 139)
	pdf.CellFormat(sigColW, 3.5, "Tanggal: "+doc.Tanggal, "", 2, "C", false, 0, "")

	// Kolom 2: Disetujui Oleh (Manajemen Operasional)
	col2SigX := pdfMarginLeft + sigColW + 6.0
	pdf.SetXY(col2SigX, sigY)
	pdf.SetFont("Helvetica", "", 8)
	pdf.SetTextColor(71, 85, 105)
	pdf.CellFormat(sigColW, 4, "Disetujui Oleh,", "", 2, "C", false, 0, "")
	pdf.SetFont("Helvetica", "B", 8)
	pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(sigColW, 4, "Manajemen Operasional", "", 2, "C", false, 0, "")

	// Cap / Stempel status otorisasi resmi
	if doc.Final {
		pdf.SetXY(col2SigX+6.0, sigY+9.0)
		pdf.SetDrawColor(22, 163, 74)   // Emerald 600
		pdf.SetFillColor(240, 253, 244) // Emerald 50
		pdf.SetTextColor(21, 128, 61)
		pdf.Rect(col2SigX+6.0, sigY+9.0, sigColW-12.0, 8.5, "DF")
		pdf.SetXY(col2SigX+6.0, sigY+9.5)
		pdf.SetFont("Helvetica", "B", 7)
		pdf.CellFormat(sigColW-12.0, 3.5, "MITRA SEMBAKO", "", 2, "C", false, 0, "")
		pdf.SetFont("Helvetica", "B", 6.5)
		pdf.CellFormat(sigColW-12.0, 3.5, "OTORISASI RESMI DISETUJUI", "", 2, "C", false, 0, "")
	} else {
		pdf.SetXY(col2SigX+6.0, sigY+9.0)
		pdf.SetDrawColor(203, 213, 225)
		pdf.SetTextColor(148, 163, 184)
		pdf.SetFont("Helvetica", "I", 7)
		pdf.CellFormat(sigColW-12.0, 8.5, "[ Menunggu Persetujuan ]", "", 2, "C", false, 0, "")
	}

	pdf.SetXY(col2SigX, sigY+22.0)
	pdf.SetFont("Helvetica", "", 8)
	pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(sigColW, 4, "( ............................................ )", "", 2, "C", false, 0, "")
	pdf.SetFont("Helvetica", "", 7)
	pdf.SetTextColor(100, 116, 139)
	pdf.CellFormat(sigColW, 3.5, "Mitra Sembako", "", 2, "C", false, 0, "")

	// Kolom 3: Dikonfirmasi & Diterima (Pemasok)
	col3SigX := pdfMarginLeft + (sigColW+6.0)*2
	pdf.SetXY(col3SigX, sigY)
	pdf.SetFont("Helvetica", "", 8)
	pdf.SetTextColor(71, 85, 105)
	pdf.CellFormat(sigColW, 4, "Dikonfirmasi & Diterima,", "", 2, "C", false, 0, "")
	pdf.SetFont("Helvetica", "B", 8)
	pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(sigColW, 4, "Pihak Pemasok (Vendor)", "", 2, "C", false, 0, "")
	pdf.SetXY(col3SigX, sigY+22.0)
	pdf.SetFont("Helvetica", "", 8)
	pdf.SetTextColor(15, 23, 42)
	pdf.CellFormat(sigColW, 4, "( ............................................ )", "", 2, "C", false, 0, "")
	pdf.SetFont("Helvetica", "", 7)
	pdf.SetTextColor(100, 116, 139)
	pdf.CellFormat(sigColW, 3.5, "Cap Perusahaan & Tanda Tangan", "", 2, "C", false, 0, "")
}
