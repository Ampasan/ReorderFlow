package utils

import "github.com/jung-kurt/gofpdf"

// drawPDFFooter menggambar garis dan keterangan footer dokumen resmi.
func drawPDFFooter(pdf *gofpdf.Fpdf) {
	footerY := 282.0
	pdf.SetLineWidth(0.2)
	pdf.SetDrawColor(203, 213, 225)
	pdf.Line(pdfMarginLeft, footerY, pdfPageWidth-pdfMarginRight, footerY)

	pdf.SetXY(pdfMarginLeft, footerY+1.5)
	pdf.SetFont("Helvetica", "", 7)
	pdf.SetTextColor(148, 163, 184)
	pdf.CellFormat(pdfContentWidth-30, 4, "Dokumen resmi diterbitkan oleh Divisi Pengadaan Mitra Sembako melalui sistem otomasi pengadaan.", "", 0, "L", false, 0, "")
	pdf.CellFormat(30, 4, "Halaman 1 dari 1", "", 1, "R", false, 0, "")
}
