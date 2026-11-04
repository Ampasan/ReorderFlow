package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"google.golang.org/genai"

	"reorderflow-backend/internal/model"
)

const (
	defaultGeminiModel = "gemini-flash-lite-latest"
	geminiAttempts     = 2
	geminiRetryDelay   = 500 * time.Millisecond
	geminiRequestLimit = 20 * time.Second
)

type StockAIService struct {
	client *genai.Client
	model  string
}

type stockRecommendationInput struct {
	ID       int `json:"id"`
	Stock    int `json:"stok"`
	ROP      int `json:"rop"`
	MinOrder int `json:"minimum_order"`
}

type stockRecommendation struct {
	ID       int    `json:"id"`
	Priority string `json:"prioritas"`
	Reason   string `json:"alasan"`
}

type stockRecommendationOutput struct {
	Summary         string                `json:"ringkasan"`
	Recommendations []stockRecommendation `json:"rekomendasi"`
}

func NewStockAIService(apiKey, modelName string) (*StockAIService, error) {
	apiKey = strings.TrimSpace(apiKey)
	if apiKey == "" {
		return nil, errors.New("GEMINI_API_KEY is empty")
	}

	modelName = strings.TrimSpace(modelName)
	if modelName == "" {
		modelName = defaultGeminiModel
	}

	client, err := genai.NewClient(context.Background(), &genai.ClientConfig{
		APIKey:  apiKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		return nil, err
	}
	return &StockAIService{client: client, model: modelName}, nil
}

func (s *StockAIService) AnalyzeLowStock(ctx context.Context, items []model.Stok) (model.StockAnalysis, error) {
	prompt, err := stockInsightPrompt(items)
	if err != nil {
		return model.StockAnalysis{}, err
	}

	content, err := s.generateJSON(ctx, prompt, "Analisis data low-stock berikut untuk pemilik usaha, dengan Bahasa Indonesia sederhana. Kembalikan JSON dengan bentuk {\"ringkasan\":\"...\",\"rekomendasi\":[{\"id\":1,\"prioritas\":\"TINGGI|SEDANG|RENDAH\",\"alasan\":\"...\"}]}. Ringkasan maksimal 45 kata, menjelaskan arti stok terhadap ROP dan langkah pemeriksaan, tanpa menyarankan jumlah pesanan atau menyatakan PO sudah dibuat. Untuk setiap id, tentukan prioritas berdasarkan proporsi stok terhadap ROP dan alasan maksimal 12 kata, hanya dari angka pada data. Satu hasil untuk setiap id, tanpa duplikat. Jangan menebak penjualan, permintaan, atau lama pengiriman. Jika daftar kosong, rekomendasi harus kosong dan ringkasan hanya menyatakan tidak ada barang yang mencapai ROP.", min(256+int32(len(items))*96, 8192), 0.2)
	if err != nil {
		return model.StockAnalysis{}, err
	}
	return parseStockAnalysis(items, content)
}

func (s *StockAIService) PrioritizeLowStock(ctx context.Context, items []model.Stok) (map[string]model.StockRecommendation, error) {
	prompt, err := stockRecommendationPrompt(items)
	if err != nil {
		return nil, err
	}

	maxOutputTokens := 192 + int32(len(items))*64
	if maxOutputTokens > 8192 {
		maxOutputTokens = 8192
	}

	content, err := s.generateJSON(ctx, prompt, "Bandingkan proporsi stok terhadap ROP untuk menentukan prioritas pemeriksaan antarbarang. TINGGI untuk defisit relatif terbesar, SEDANG untuk defisit menengah, dan RENDAH untuk stok tepat atau mendekati ROP. Gunakan minimum order hanya sebagai konteks. Prioritas hanya boleh TINGGI, SEDANG, atau RENDAH. Tulis alasan singkat dalam Bahasa Indonesia, maksimal 12 kata, hanya dari angka pada data. Jangan menebak penjualan, permintaan, atau lama pengiriman. Jangan mengubah atau menyarankan jumlah pesanan. Balas sebagai JSON dengan bentuk {\"rekomendasi\":[{\"id\":1,\"prioritas\":\"TINGGI|SEDANG|RENDAH\",\"alasan\":\"...\"}]}, satu hasil untuk setiap id.", maxOutputTokens, 0.1)
	if err != nil {
		return nil, err
	}

	return parseStockRecommendations(items, content)
}

func (s *StockAIService) generateJSON(ctx context.Context, prompt, systemInstruction string, maxOutputTokens int32, temperature float32) (string, error) {
	var lastErr error
	for attempt := 0; attempt < geminiAttempts; attempt++ {
		if attempt > 0 {
			select {
			case <-ctx.Done():
				return "", ctx.Err()
			case <-time.After(geminiRetryDelay):
			}
		}

		content, err := s.generateOnce(ctx, prompt, systemInstruction, maxOutputTokens, temperature)
		if err == nil {
			return content, nil
		}
		lastErr = err
	}
	return "", lastErr
}

func (s *StockAIService) generateOnce(ctx context.Context, prompt, systemInstruction string, maxOutputTokens int32, temperature float32) (string, error) {
	requestCtx, cancel := context.WithTimeout(ctx, geminiRequestLimit)
	defer cancel()

	response, err := s.client.Models.GenerateContent(requestCtx, s.model, []*genai.Content{
		{Parts: []*genai.Part{{Text: prompt}}},
	}, &genai.GenerateContentConfig{
		SystemInstruction: &genai.Content{Parts: []*genai.Part{{Text: systemInstruction}}},
		ThinkingConfig:    &genai.ThinkingConfig{ThinkingLevel: genai.ThinkingLevelLow},
		ResponseMIMEType:  "application/json",
		MaxOutputTokens:   maxOutputTokens,
		Temperature:       genai.Ptr(temperature),
	})
	if err != nil {
		return "", err
	}
	if response == nil {
		return "", errors.New("Gemini returned an empty response")
	}

	content := strings.TrimSpace(response.Text())
	if content == "" {
		return "", errors.New("Gemini returned an empty response")
	}
	if !json.Valid([]byte(content)) {
		return "", errors.New("Gemini returned incomplete JSON")
	}
	return content, nil
}

func parseStockRecommendations(items []model.Stok, content string) (map[string]model.StockRecommendation, error) {
	var output stockRecommendationOutput
	if err := json.Unmarshal([]byte(content), &output); err != nil {
		return nil, fmt.Errorf("decode Gemini stock recommendations: %w", err)
	}
	return mapStockRecommendations(items, output.Recommendations)
}

func mapStockRecommendations(items []model.Stok, output []stockRecommendation) (map[string]model.StockRecommendation, error) {
	if len(output) != len(items) {
		return nil, errors.New("Gemini returned an incomplete stock recommendation list")
	}

	recommendations := make(map[string]model.StockRecommendation, len(items))
	for _, recommendation := range output {
		if recommendation.ID < 1 || recommendation.ID > len(items) {
			return nil, errors.New("Gemini returned an unknown stock recommendation id")
		}

		priority := strings.ToUpper(strings.TrimSpace(recommendation.Priority))
		if priority != model.StockPriorityHigh && priority != model.StockPriorityMedium && priority != model.StockPriorityLow {
			return nil, errors.New("Gemini returned an invalid stock priority")
		}
		reason := strings.TrimSpace(recommendation.Reason)
		if reason == "" || len(reason) > 160 {
			return nil, errors.New("Gemini returned an invalid stock recommendation reason")
		}

		sku := items[recommendation.ID-1].SKU
		if _, exists := recommendations[sku]; exists {
			return nil, errors.New("Gemini returned a duplicate stock recommendation")
		}
		recommendations[sku] = model.StockRecommendation{Priority: priority, Reason: reason}
	}
	if len(recommendations) != len(items) {
		return nil, errors.New("Gemini returned an incomplete stock recommendation list")
	}

	return recommendations, nil
}

func stockRecommendationPrompt(items []model.Stok) (string, error) {
	encoded, err := json.Marshal(stockRecommendationInputs(items))
	if err != nil {
		return "", fmt.Errorf("encode stock recommendation input: %w", err)
	}
	return fmt.Sprintf("Tentukan prioritas pemeriksaan untuk data stok berikut:\n%s", encoded), nil
}

func stockRecommendationInputs(items []model.Stok) []stockRecommendationInput {
	input := make([]stockRecommendationInput, 0, len(items))
	for index, item := range items {
		input = append(input, stockRecommendationInput{
			ID:       index + 1,
			Stock:    item.StokSaatIni,
			ROP:      item.ReorderPoint,
			MinOrder: item.QtyMinOrder,
		})
	}
	return input
}

func stockInsightPrompt(items []model.Stok) (string, error) {
	encoded, err := json.Marshal(stockRecommendationInputs(items))
	if err != nil {
		return "", fmt.Errorf("encode stock analysis input: %w", err)
	}
	return fmt.Sprintf("Buat ringkasan dan rekomendasi AI untuk data stok berikut:\n%s", encoded), nil
}

func parseStockAnalysis(items []model.Stok, content string) (model.StockAnalysis, error) {
	var output stockRecommendationOutput
	if err := json.Unmarshal([]byte(content), &output); err != nil {
		return model.StockAnalysis{}, fmt.Errorf("decode Gemini stock analysis: %w", err)
	}

	summary := strings.TrimSpace(output.Summary)
	if summary == "" || len(summary) > 1200 {
		return model.StockAnalysis{}, errors.New("Gemini returned an invalid stock analysis summary")
	}

	recommendations, err := mapStockRecommendations(items, output.Recommendations)
	if err != nil {
		return model.StockAnalysis{}, err
	}

	analysis := model.StockAnalysis{
		ItemCount:   len(items),
		Explanation: summary,
		Items:       make([]model.StockAnalysisItem, 0, len(items)),
	}
	for _, item := range items {
		recommendation := recommendations[item.SKU]
		analysis.Items = append(analysis.Items, model.StockAnalysisItem{
			SKU:          item.SKU,
			Nama:         item.Nama,
			StokSaatIni:  item.StokSaatIni,
			ReorderPoint: item.ReorderPoint,
			Prioritas:    recommendation.Priority,
			Alasan:       recommendation.Reason,
		})
	}
	return analysis, nil
}
