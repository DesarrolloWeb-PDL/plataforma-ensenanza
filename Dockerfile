FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@12.16.1 --activate

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY apps/api/package.json apps/api/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
COPY packages/storage/package.json packages/storage/
RUN pnpm install --frozen-lockfile

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app ./
COPY . .
EXPOSE 4000
CMD ["pnpm", "--filter", "@plataforma/api", "start"]
