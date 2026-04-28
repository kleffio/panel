package routing

import (
	"context"

	lokistore "github.com/kleffio/platform/internal/core/logs/adapters/loki"
	"github.com/kleffio/platform/internal/core/logs/domain"
	"github.com/kleffio/platform/internal/core/logs/ports"
)

// Store writes logs to a primary store and reads from Loki when available.
// If lokiURL returns a non-empty string, ListByWorkload queries Loki;
// otherwise it falls back to the primary store.
type Store struct {
	primary ports.LogRepository
	lokiURL func(ctx context.Context) string
}

func NewStore(primary ports.LogRepository, lokiURL func(ctx context.Context) string) *Store {
	return &Store{primary: primary, lokiURL: lokiURL}
}

func (s *Store) SaveBatch(ctx context.Context, lines []*domain.LogLine) error {
	return s.primary.SaveBatch(ctx, lines)
}

func (s *Store) ListByWorkload(ctx context.Context, workloadID string, limit int) ([]*domain.LogLine, error) {
	if u := s.lokiURL(ctx); u != "" {
		return lokistore.NewStore(u).ListByWorkload(ctx, workloadID, limit)
	}
	return s.primary.ListByWorkload(ctx, workloadID, limit)
}
