.PHONY: dev build migrate lint

dev:
	docker compose -f docker-compose.dev.yml up --build

build:
	docker compose build

migrate:
	cd api && goose -dir migrations postgres "$$DATABASE_URL" up

lint-api:
	cd api && golangci-lint run

lint-web:
	cd web && pnpm lint
