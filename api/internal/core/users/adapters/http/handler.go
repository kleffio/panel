// Package http exposes REST endpoints for the users module.
package http

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/kleffio/platform/internal/core/users/application"
	"github.com/kleffio/platform/internal/core/users/domain"
	"github.com/kleffio/platform/internal/shared/middleware"
)

const basePath = "/api/v1/users"

// Handler groups all HTTP endpoints for the users module.
type Handler struct {
	svc *application.Service
}

// NewHandler creates a Handler.
func NewHandler(svc *application.Service) *Handler {
	return &Handler{svc: svc}
}

// RegisterRoutes attaches all user routes to the provided router.
func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get(basePath+"/me", h.getMe)
	r.Patch(basePath+"/me", h.updateMe)
	r.Post(basePath+"/me/avatar", h.uploadAvatar)
}

func (h *Handler) getMe(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, errBody("unauthorized"))
		return
	}

	profile, err := h.svc.GetOrCreate(r.Context(), claims.Subject, claims.Username)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errBody("failed to load profile"))
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": profile})
}

func (h *Handler) updateMe(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.ClaimsFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, errBody("unauthorized"))
		return
	}

	var body struct {
		Bio             *string                  `json:"bio"`
		ThemePreference *domain.ThemePreference  `json:"theme_preference"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, errBody("invalid request body"))
		return
	}

	profile, err := h.svc.Update(r.Context(), claims.Subject, domain.UpdateInput{
		Bio:             body.Bio,
		ThemePreference: body.ThemePreference,
	})
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, errBody("failed to update profile"))
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": profile})
}

func (h *Handler) uploadAvatar(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusNotImplemented, errBody("avatar upload is not yet supported"))
}

func errBody(msg string) map[string]string {
	return map[string]string{"error": msg}
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
