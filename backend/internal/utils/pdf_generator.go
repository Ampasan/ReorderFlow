package utils

import (
	"bytes"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/jung-kurt/gofpdf"
)

const logoUMKMURL = "https://res.cloudinary.com/drrmbeiyk/image/upload/v1793683653/rwwm4f5vcnftikgzvubq.png"

const (
	pdfPageWidth    = 210.0
	pdfMarginLeft   = 14.0
	pdfMarginRight  = 14.0
	pdfContentWidth = pdfPageWidth - pdfMarginLeft - pdfMarginRight
	pdfPartyBoxY    = 42.5
	pdfPartyBoxH    = 26.0
)

var (
	logoUMKMOnce  sync.Once
	logoUMKMBytes []byte
)

func loadLogoUMKM() {
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(logoUMKMURL)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil || len(data) == 0 {
		return
	}
	logoUMKMBytes = data
}

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
	pdf.SetMargins(pdfMarginLeft, 12, pdfMarginRight)
	pdf.SetAutoPageBreak(false, 0)
	// Tolak semua page break otomatis agar dokumen tetap 1 halaman
	pdf.SetAcceptPageBreakFunc(func() bool { return false })
	pdf.AddPage()

	logoUMKMOnce.Do(loadLogoUMKM)

	drawPDFHeader(pdf, doc, logoUMKMBytes)
	drawPDFPartyBoxes(pdf, doc)
	drawPDFItemsTable(pdf, doc)
	drawPDFTermsAndSignatures(pdf, doc)
	drawPDFFooter(pdf)

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
