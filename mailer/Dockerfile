FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better build caching).
# Use the lockfile + npm ci for reproducible, tested dependency versions.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# App source + the one-pager asset
COPY server.js ./
COPY assets ./assets

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Basic container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
