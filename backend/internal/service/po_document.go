package service

import (
	"context"
	"fmt"
	"time"

	"reorderflow-backend/internal/model"
	"reorderflow-backend/internal/repository"
	"reorderflow-backend/internal/utils"
)

func detailSKUs(details []model.PODetail) []string {
	skus := make([]string, 0, len(details))
	for _, detail := range details {
		skus = append(skus, detail.SKU)
	}
	return skus
}

func loadStockNames(
	stokRepo *repository.StokRepository,
	skus []string,
	nomorPO string,
) map[string]model.Stok {
	stockBySKU, err := stokRepo.GetBySKUs(skus)
	if err != nil {
		utils.Logger.Warn("stock lookup failed while rendering PO", "nomor_po", nomorPO, "error", err)
	}
	return stockBySKU
}

func pdfItemsFromDetails(
	details []model.PODetail,
	stockBySKU map[string]model.Stok,
) ([]utils.PDFItem, int) {
	items := make([]utils.PDFItem, 0, len(details))
	totalQty := 0
	for _, detail := range details {
		nama := detail.SKU
		if stok, ok := stockBySKU[detail.SKU]; ok {
			nama = stok.Nama
		}
		items = append(items, utils.PDFItem{
			SKU:    detail.SKU,
			Nama:   nama,
			Jumlah: detail.JumlahOrder,
		})
		totalQty += detail.JumlahOrder
	}
	return items, totalQty
}

func newPODocument(
	po *model.POLog,
	items []utils.PDFItem,
	totalQty int,
	tanggal string,
	final bool,
) utils.PODocument {
	return utils.PODocument{
		NomorPO:      po.NomorPO,
		Tanggal:      tanggal,
		PemasokNama:  supplierName(po),
		PemasokEmail: supplierEmail(po),
		Items:        items,
		TotalQty:     totalQty,
		Final:        final,
	}
}

func uploadPDF(
	ctx context.Context,
	storage *utils.SupabaseStorage,
	filename string,
	pdfBytes []byte,
) (string, error) {
	var publicURL string
	err := Retry(ctx, 3, StorageBackoff, func() error {
		url, uploadErr := storage.Upload(filename, pdfBytes, "application/pdf")
		if uploadErr != nil {
			return uploadErr
		}
		publicURL = url
		return nil
	})
	if err != nil {
		return "", err
	}
	return publicURL, nil
}

func supplierName(po *model.POLog) string {
	if po.Pemasok != nil {
		return po.Pemasok.Nama
	}
	return ""
}

func supplierEmail(po *model.POLog) string {
	if po.Pemasok != nil {
		return po.Pemasok.Email
	}
	return ""
}

func poTotalQty(details []model.PODetail) int {
	total := 0
	for _, d := range details {
		total += d.JumlahOrder
	}
	return total
}

func poPDFFilename(po *model.POLog) string {
	return fmt.Sprintf("PO_%s_%d.pdf", po.NomorPO, time.Now().Unix())
}
