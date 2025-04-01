# https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile
# e.g., docker build --build-arg NEXT_PUBLIC_API_ENDPOINT_BROWSER="http://localhost:9033" --build-arg NEXT_PUBLIC_API_ENDPOINT_INTERNAL="http://flask:5000" -t cycle-app next/

FROM node:18-alpine AS base

FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY ./cycle-network/package.json ./cycle-network/package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_ENDPOINT_BROWSER
ARG NEXT_PUBLIC_API_ENDPOINT_INTERNAL
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_GA_CODE

ENV NEXT_PUBLIC_API_ENDPOINT_BROWSER=${NEXT_PUBLIC_API_ENDPOINT_BROWSER}
ENV NEXT_PUBLIC_API_ENDPOINT_INTERNAL=${NEXT_PUBLIC_API_ENDPOINT_INTERNAL}
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}
ENV NEXT_PUBLIC_GA_CODE=${NEXT_PUBLIC_GA_CODE}

COPY --from=deps /app/node_modules ./node_modules
COPY ./cycle-network .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

RUN cp -r .next/static .next/standalone/.next/

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ARG NEXT_PORT
ENV PORT=${NEXT_PORT}

ENV NODE_ENV=production

ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs


ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

