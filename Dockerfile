# ---- Build stage: compile the static bundle with Bun ----
FROM oven/bun:1.3-alpine AS build
WORKDIR /app

# Install deps first so this layer is cached unless the lockfile changes
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build — Vite outputs to /app/dist
COPY . .
RUN bun run build

# ---- Serve stage: static files via nginx ----
FROM nginx:1-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK CMD wget -qO- http://localhost/ || exit 1
# The nginx base image's default CMD already runs: nginx -g "daemon off;"
