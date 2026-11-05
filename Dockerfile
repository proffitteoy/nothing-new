# Self-hosted Next.js runtime. Build on a Linux host with Docker BuildKit.
FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV HOSTING_STANDALONE=1
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
# Notes are read from the filesystem at runtime, not only at build time.
COPY --from=builder --chown=node:node /app/.quartz-cache/next ./.quartz-cache/next
USER node
EXPOSE 3000
CMD ["node", "server.js"]
