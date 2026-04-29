package routing

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/kleffio/platform/internal/core/logs/domain"
	"github.com/kleffio/platform/internal/core/logs/ports"
)

// Store writes logs to the primary store and reads from whichever log backend
// plugin is active. When queryURL returns a non-empty string, ListByWorkload
// proxies to that URL using the platform's standard query contract:
//
//	GET <queryURL>?workload_id=<id>&limit=<n>
//	→ {"lines": [{workload_id, ts, stream, line}, ...]}
//
// Any monitoring.logs plugin can satisfy this contract — no backend-specific
// code lives in the platform.
type Store struct {
	primary  ports.LogRepository
	queryURL func(ctx context.Context) string
	client   *http.Client
}

func NewStore(primary ports.LogRepository, queryURL func(ctx context.Context) string) *Store {
	return &Store{
		primary:  primary,
		queryURL: queryURL,
		client:   &http.Client{Timeout: 10 * time.Second},
	}
}

func (s *Store) SaveBatch(ctx context.Context, lines []*domain.LogLine) error {
	return s.primary.SaveBatch(ctx, lines)
}

func (s *Store) ListByWorkload(ctx context.Context, workloadID string, limit int) ([]*domain.LogLine, error) {
	if u := s.queryURL(ctx); u != "" {
		return s.queryBackend(ctx, u, workloadID, limit)
	}
	return s.primary.ListByWorkload(ctx, workloadID, limit)
}

func (s *Store) queryBackend(ctx context.Context, baseURL, workloadID string, limit int) ([]*domain.LogLine, error) {
	if limit <= 0 {
		limit = 200
	}

	params := url.Values{
		"workload_id": {workloadID},
		"limit":       {strconv.Itoa(limit)},
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, baseURL+"?"+params.Encode(), nil)
	if err != nil {
		return nil, fmt.Errorf("build log query request: %w", err)
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("log backend query: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("log backend returned status %d", resp.StatusCode)
	}

	var result struct {
		Lines []*domain.LogLine `json:"lines"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode log backend response: %w", err)
	}
	return result.Lines, nil
}
