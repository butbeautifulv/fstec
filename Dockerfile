# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl curl
WORKDIR /app

# --- dependencies (prod + dev for build) ---
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# --- build Next.js standalone + Prisma client ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Build-only placeholders — runtime secrets come from docker-compose.
ENV SESSION_SECRET=build-time-dummy-secret-minimum-32-characters-long
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build?schema=public
ENV S3_ENDPOINT=http://localhost:9000
ENV S3_ACCESS_KEY=build
ENV S3_SECRET_KEY=build-secret-minimum-32-characters-long
ENV S3_BUCKET=build

RUN npx prisma generate
RUN npm run build

# --- database migrations (non-root, slim) ---
FROM base AS migrate
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs

USER nextjs
ENTRYPOINT ["./node_modules/.bin/prisma"]
CMD ["migrate", "deploy"]

# --- production runtime (non-root) ---
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/cache-handler.mjs ./cache-handler.mjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/login > /dev/null || exit 1

CMD ["node", "server.js"]
