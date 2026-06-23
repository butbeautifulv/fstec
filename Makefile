.PHONY: dev dev-boot dev-app dev-infra dev-infra-down migrate dev-corpus

# Full local boot: Postgres/MinIO → reset → corpus seed → Next.js
dev-corpus:
	make dev-infra && \
	if [ -d ".external/240 93 6837" ]; then npm run corpus:build-seed-manifest; fi && \
	npm run db:boot:corpus && npm run dev

# Full local boot: Postgres/MinIO → migrate → Next.js
dev-boot:
	npm run dev:boot

dev:
	npm run dev:stack

dev-app:
	npm run dev

dev-infra:
	npm run dev:infra

dev-infra-down:
	npm run dev:infra:down

migrate:
	npm run db:migrate && npm run db:generate
