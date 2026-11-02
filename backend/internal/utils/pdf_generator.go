package utils

import (
	"bytes"
	_ "embed"
	"fmt"
	"strings"

	"github.com/jung-kurt/gofpdf"
)

//go:embed logo-umkm.png
var logoUMKMBytes []byte

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
	Final        bool
}

// GeneratePO menghasilkan dokumen Purchase Order resmi untuk Mitra Sembako.
func GeneratePO(doc PODocument) ([]byte, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(14, 12, 14)
	pdf.SetAutoPageBreak(false, 0)
	// Tolak semua page break otomatis agar dokumen tetap 1 halaman
	pdf.SetAcceptPageBreakFunc(func() bool { return false })
	pdf.AddPage()

	pageW := 210.0
	marginL := 14.0
	marginR := 14.0
	contentW := pageW - marginL - marginR // 182 mm

	// ==========================================
	// 1. KOP SURAT PERUSAHAAN (HEADER MITRA SEMBAKO)
	// ==========================================

	// Daftarkan dan cetak logo UMKM jika bytes tersedia
	logoW := 25.0
	hasLogo := len(logoUMKMBytes) > 0
	if hasLogo {
		opt := gofpdf.ImageOptions{
			ImageType: "PNG",
			ReadDpi:   true,
		}
		pdf.RegisterImageOptionsReader("logo_umkm", opt, bytes.NewReader(logoUMKMBytes))
		if pdf.Error() == nil {
			pdf.ImageOptions("logo_umkm", marginL, 12, logoW, 0, false, opt, 0, "")
		}
	}

	// Identitas UMKM Mitra Sembako di sebelah kanan logo
	infoX := marginL
	if hasLogo {
		infoX = marginL + logoW + 4.0
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
	boxX := pageW - marginR - boxW
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
	pdf.Line(marginL, 38, pageW-marginR, 38)

	pdf.SetLineWidth(0.2)
	pdf.SetDrawColor(148, 163, 184) // Slate 400
	pdf.Line(marginL, 39.2, pageW-marginR, 39.2)

	// ==========================================
	// 2. KOTAK INFORMASI VENDOR & PENGIRIMAN
	// ==========================================
	colW := (contentW - 6.0) / 2.0 // 88 mm
	startY := 42.5
	boxH := 26.0

	// Kotak Kiri: Informasi Pemasok / Vendor
	pdf.SetDrawColor(203, 213, 225) // Slate 300
	pdf.SetFillColor(248, 250, 252) // Slate 50
	pdf.Rect(marginL, startY, colW, boxH, "DF")

	// Header Strip Kotak Kiri
	pdf.SetXY(marginL, startY)
	pdf.SetFillColor(241, 245, 249) // Slate 100
	pdf.SetFont("Helvetica", "B", 8)
	pdf.SetTextColor(71, 85, 105)
	pdf.CellFormat(colW, 5.5, "  KEPADA YTH. (PEMASOK / VENDOR)", "B", 1, "L", true, 0, "")

	pdf.SetX(marginL + 2.5)
	pdf.SetFont("Helvetica", "B", 9.5)
	pdf.SetTextColor(15, 23, 42)
	pemasokNama := doc.PemasokNama
	if strings.TrimSpace(pemasokNama) == "" {
		pemasokNama = "-"
	}
	pdf.CellFormat(colW-5, 5.5, pemasokNama, "", 1, "L", false, 0, "")

	pdf.SetX(marginL + 2.5)
	pdf.SetFont("Helvetica", "", 8)
	pdf.SetTextColor(71, 85, 105)
	pemasokEmail := doc.PemasokEmail
	if strings.TrimSpace(pemasokEmail) == "" {
		pemasokEmail = "Email belum terdaftar"
	}
	pdf.CellFormat(colW-5, 4.5, "Email: "+pemasokEmail, "", 1, "L", false, 0, "")

	pdf.SetX(marginL + 2.5)
	pdf.SetFont("Helvetica", "I", 7.5)
	pdf.SetTextColor(100, 116, 139)
	pdf.CellFormat(colW-5, 4.5, "Kemitraan Resmi Mitra Sembako", "", 1, "L", false, 0, "")

	// Kotak Kanan: Lokasi Pengiriman (Ship To)
	col2X := marginL + colW + 6.0
	pdf.SetDrawColor(203, 213, 225)
	pdf.SetFillColor(248, 250, 252)
	pdf.Rect(col2X, startY, colW, boxH, "DF")

	// Header Strip Kotak Kanan
	pdf.SetXY(col2X, startY)
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

	// ==========================================
	// 3. TABEL DAFTAR BARANG PEMESANAN
	// ==========================================
	tableY := startY + boxH + 5.0
	pdf.SetXY(marginL, tableY)

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

	// ==========================================
	// 4. KETENTUAN PENGADAAN & PENGIRIMAN
	// ==========================================
	pdf.Ln(4)
	termsY := pdf.GetY()

	termsBoxH := 24.0
	pdf.SetDrawColor(226, 232, 240)
	pdf.SetFillColor(248, 250, 252)
	pdf.Rect(marginL, termsY, contentW, termsBoxH, "DF")

	pdf.SetXY(marginL+3, termsY+2)
	pdf.SetFont("Helvetica", "B", 7.5)
	pdf.SetTextColor(51, 65, 85)
	pdf.CellFormat(contentW-6, 4, "SYARAT & KETENTUAN PEMESANAN:", "", 1, "L", false, 0, "")

	pdf.SetFont("Helvetica", "", 7)
	pdf.SetTextColor(100, 116, 139)
	pdf.SetX(marginL + 3)
	pdf.CellFormat(contentW-6, 3.5, "1. Surat Jalan dan Faktur asli wajib mencantumkan Nomor PO ini dan dilampirkan saat pengiriman fisik.", "", 1, "L", false, 0, "")
	pdf.SetX(marginL + 3)
	pdf.CellFormat(contentW-6, 3.5, "2. Barang harus dalam kondisi prima, kemasan utuh, dan tanggal kedaluwarsa (expired date) minimal 12 bulan.", "", 1, "L", false, 0, "")
	pdf.SetX(marginL + 3)
	pdf.CellFormat(contentW-6, 3.5, "3. Pemeriksaan mutu dan kuantitas dilakukan oleh bagian logistik gudang saat serah terima barang.", "", 1, "L", false, 0, "")
	pdf.SetX(marginL + 3)
	pdf.CellFormat(contentW-6, 3.5, "4. Pembayaran diproses sesuai kesepakatan tempo usaha (Net 30) setelah Berita Acara Penerimaan Barang diverifikasi.", "", 1, "L", false, 0, "")

	// ==========================================
	// 5. BLOK OTORISASI & TANDA TANGAN RESMI
	// ==========================================
	// Posisikan blok tanda tangan secara rapi (maks sigY=232 agar tidak melewati footer di Y=270)
	sigY := termsY + termsBoxH + 5.0
	if sigY > 232 {
		sigY = 232
	}

	sigColW := (contentW - 12.0) / 3.0 // ~56.6 mm

	// Kolom 1: Dibuat Oleh (Purchasing)
	col1SigX := marginL
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
	col2SigX := marginL + sigColW + 6.0
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
	col3SigX := marginL + (sigColW+6.0)*2
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

	// ==========================================
	// 6. FOOTER DOKUMEN RESMI
	// ==========================================
	footerY := 282.0
	pdf.SetLineWidth(0.2)
	pdf.SetDrawColor(203, 213, 225)
	pdf.Line(marginL, footerY, pageW-marginR, footerY)

	pdf.SetXY(marginL, footerY+1.5)
	pdf.SetFont("Helvetica", "", 7)
	pdf.SetTextColor(148, 163, 184)
	pdf.CellFormat(contentW-30, 4, "Dokumen resmi diterbitkan oleh Divisi Pengadaan Mitra Sembako melalui sistem otomasi pengadaan.", "", 0, "L", false, 0, "")
	pdf.CellFormat(30, 4, "Halaman 1 dari 1", "", 1, "R", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
