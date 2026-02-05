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

RUN pnpm build

EXPOSE 3000

RUN mkdir -p /data/db

CMD ["pnpm", "start:prod"]