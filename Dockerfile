# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN corepack enable pnpm
WORKDIR /app

# Copy lockfile and full source of local file: packages so pnpm captures all
# files into the virtual store during install (not just package.json).
COPY panel/package.json panel/pnpm-lock.yaml ./panel/
COPY plugin-components/ ./plugin-components/
COPY plugin-sdk-js/ ./plugin-sdk-js/

# pnpm install from the panel directory will follow file:../ sibling paths
WORKDIR /app/panel
RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable pnpm
WORKDIR /app

# Copy all source code and the installed node_modules
COPY --from=deps /app/panel/node_modules ./panel/node_modules
COPY panel/ ./panel/
COPY plugin-components/ ./plugin-components/
COPY plugin-sdk-js/ ./plugin-sdk-js/

WORKDIR /app/panel

ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* vars are baked into the JS bundle at build time.
ARG NEXT_PUBLIC_OIDC_AUTHORITY
ARG NEXT_PUBLIC_OIDC_CLIENT_ID
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_OIDC_AUTHORITY=$NEXT_PUBLIC_OIDC_AUTHORITY
ENV NEXT_PUBLIC_OIDC_CLIENT_ID=$NEXT_PUBLIC_OIDC_CLIENT_ID
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN pnpm build

# ── Stage 3: Runtime ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy standalone output and static assets
COPY --from=builder /app/panel/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/panel/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/panel/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Standalone server structure puts the app folder inside.
CMD ["node", "server.js"]
