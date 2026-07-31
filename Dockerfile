# ---- Builder: install deps + build ----
FROM node:24-bookworm AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN mkdir -p docs && npm run build

# ---- Runtime: production image ----
FROM node:24-bookworm-slim

# Agent bridge requires python3
RUN apt-get update && apt-get install -y --no-install-recommends python3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY scripts/reset-default-login.mjs ./scripts/reset-default-login.mjs

ENV NODE_ENV=production
ENV HERMES_WEB_UI_HOME=/data
ENV HERMES_WEB_UI_DISABLE_GATEWAY_AUTOSTART=1

EXPOSE 8648

VOLUME /data

CMD ["node", "dist/server/index.js"]
