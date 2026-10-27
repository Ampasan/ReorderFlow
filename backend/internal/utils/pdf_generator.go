package utils

import (
	"bytes"
	"fmt"

	"github.com/jung-kurt/gofpdf"
)

type PDFItem struct {
	SKU    string
	Nama   string
	Jumlah int
}

type PODocument struct {
	NomorPO      string
	Tanggal      string
	PemasokNama  string
	PemasokEmail string
	Items        []PDFItem
	TotalQty     int
}

func GeneratePO(doc PODocument) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(15, 15, 15)
	pdf.AddPage()

	pdf.SetFont("Helvetica", "B", 18)
	pdf.SetTextColor(42, 26, 14)
	pdf.CellFormat(0, 10, "PURCHASE ORDER", "", 1, "L", false, 0, "")

	pdf.SetFont("Helvetica", "", 10)
	pdf.SetTextColor(90, 90, 90)
	pdf.CellFormat(0, 6, "ReorderFlow - Sistem Otomasi ROP", "", 1, "L", false, 0, "")
	pdf.CellFormat(0, 6, "Dokumen Draft (Menunggu Persetujuan)", "", 1, "L", false, 0, "")
	pdf.Ln(4)

	pdf.SetFont("Helvetica", "B", 11)
	pdf.SetTextColor(42, 26, 14)
	pdf.CellFormat(0, 7, "Nomor PO: "+doc.NomorPO, "", 1, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 10)
	pdf.CellFormat(0, 6, "Tanggal: "+doc.Tanggal, "", 1, "L", false, 0, "")
	pdf.Ln(4)

	pdf.SetFont("Helvetica", "B", 10)
	pdf.CellFormat(0, 6, "Pemasok", "", 1, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 10)
	pdf.CellFormat(0, 6, doc.PemasokNama, "", 1, "L", false, 0, "")
	pdf.CellFormat(0, 6, doc.PemasokEmail, "", 1, "L", false, 0, "")
	pdf.Ln(6)

	pdf.SetFillColor(212, 98, 26)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Helvetica", "B", 10)
	pdf.CellFormat(40, 8, "SKU", "1", 0, "C", true, 0, "")
	pdf.CellFormat(100, 8, "Nama Barang", "1", 0, "C", true, 0, "")
	pdf.CellFormat(40, 8, "Qty Order", "1", 1, "C", true, 0, "")

	pdf.SetTextColor(42, 26, 14)
	pdf.SetFont("Helvetica", "", 10)
	for _, item := range doc.Items {
		pdf.CellFormat(40, 8, item.SKU, "1", 0, "L", false, 0, "")
		pdf.CellFormat(100, 8, item.Nama, "1", 0, "L", false, 0, "")
		pdf.CellFormat(40, 8, fmt.Sprintf("%d", item.Jumlah), "1", 1, "C", false, 0, "")
	}

	pdf.SetFont("Helvetica", "B", 10)
	pdf.SetFillColor(234, 216, 192)
	pdf.SetTextColor(42, 26, 14)
	pdf.CellFormat(140, 8, "Total Item", "1", 0, "R", true, 0, "")
	pdf.CellFormat(40, 8, fmt.Sprintf("%d", doc.TotalQty), "1", 1, "C", true, 0, "")

	pdf.Ln(16)

	pdf.SetFont("Helvetica", "B", 10)
	pdf.CellFormat(90, 6, "Staf Pengadaan", "T", 0, "C", false, 0, "")
	pdf.CellFormat(90, 6, "Manajer Operasional", "T", 1, "C", false, 0, "")
	pdf.Ln(3)
	pdf.SetFont("Helvetica", "", 9)
	pdf.CellFormat(90, 6, "( ........................ )", "", 0, "C", false, 0, "")
	pdf.CellFormat(90, 6, "( ........................ )", "", 1, "C", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
