# syntax=docker/dockerfile:1

# ---- deps: install node_modules from the lockfile ----
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ---- builder: compile the Next standalone server ----
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* is baked into the client bundle at build time. The browser only
# ever calls the same-origin proxy path, so this is a constant.
ENV NEXT_PUBLIC_API_BASE_URL=/api/backend
# next.config.ts reads BACKEND_ORIGIN inside rewrites(), which Next.js
# evaluates during `next build` and bakes into the compiled routes
# manifest — a runtime env var on the running container has no effect on
# it. It must be supplied as a build arg instead.
ARG BACKEND_ORIGIN
ENV BACKEND_ORIGIN=$BACKEND_ORIGIN
RUN npm run build

# ---- runner: minimal image that serves the standalone output ----
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
