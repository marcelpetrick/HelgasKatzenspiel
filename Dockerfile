# SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
# SPDX-License-Identifier: GPL-3.0-or-later

# Stage 1: build the static game with the same Node version as CI.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
RUN npx vite build

# Stage 2: serve the static files with nginx; no Node at runtime.
FROM nginx:1.29-alpine
LABEL org.opencontainers.image.title="Helgas Katzenspiel" \
      org.opencontainers.image.description="Ein niedliches Katzenspiel für den Browser" \
      org.opencontainers.image.source="https://github.com/marcelpetrick/HelgasKatzenspiel" \
      org.opencontainers.image.licenses="GPL-3.0-or-later" \
      org.opencontainers.image.authors="Marcel Petrick <mail@marcelpetrick.it>"
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
