package loki

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/kleffio/platform/internal/core/logs/domain"
)

// Store reads workload logs from Loki. SaveBatch is a no-op because Alloy
// ships container logs to Loki directly via loki.source.docker.
type Store struct {
	lokiURL string
	client  *http.Client
}

func NewStore(lokiURL string) *Store {
	return &Store{
		lokiURL: lokiURL,
		client:  &http.Client{Timeout: 10 * time.Second},
	}
}

func (s *Store) SaveBatch(_ context.Context, _ []*domain.LogLine) error {
	return nil
}

func (s *Store) ListByWorkload(ctx context.Context, workloadID string, limit int) ([]*domain.LogLine, error) {
	if limit <= 0 {
		limit = 200
	}

	params := url.Values{
		"query":     {fmt.Sprintf(`{workload_id=%q}`, workloadID)},
		"limit":     {strconv.Itoa(limit)},
		"direction": {"backward"},
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		s.lokiURL+"/loki/api/v1/query_range?"+params.Encode(), nil)
	if err != nil {
		return nil, fmt.Errorf("build loki request: %w", err)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("loki query: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("loki returned status %d", resp.StatusCode)
	}

	var result lokiQueryResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode loki response: %w", err)
	}

	var lines []*domain.LogLine
	for _, stream := range result.Data.Result {
		streamLabel := stream.Stream["stream"]
		if streamLabel == "" {
			streamLabel = "stdout"
		}
		for _, v := range stream.Values {
			nsec, err := strconv.ParseInt(v[0], 10, 64)
			if err != nil {
				continue
			}
			lines = append(lines, &domain.LogLine{
				WorkloadID: workloadID,
				Ts:         time.Unix(0, nsec),
				Stream:     streamLabel,
				Line:       v[1],
			})
		}
	}

	// Loki returns results newest-first (direction=backward). Reverse to chronological.
	for i, j := 0, len(lines)-1; i < j; i, j = i+1, j-1 {
		lines[i], lines[j] = lines[j], lines[i]
	}
	return lines, nil
}

type lokiQueryResponse struct {
	Data struct {
		Result []struct {
			Stream map[string]string `json:"stream"`
			Values [][2]string       `json:"values"`
		} `json:"result"`
	} `json:"data"`
}
