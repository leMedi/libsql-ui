FROM node:24-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=true

RUN pnpm build

FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_STORE_PATH=/data

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

RUN mkdir -p /data && chown -R appuser:nodejs /data

COPY --from=builder --chown=appuser:nodejs /app/.output ./.output

USER appuser

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
