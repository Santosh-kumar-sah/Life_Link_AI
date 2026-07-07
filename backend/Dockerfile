# syntax=docker/dockerfile:1

# --- Stage 1: Build Dependencies ---
FROM node:22-alpine AS deps
WORKDIR /app

# Copy package lock definitions
COPY package.json package-lock.json ./

# Install all dependencies (development dependencies needed for potential compilation or lint checks)
RUN npm ci --frozen-lockfile

# --- Stage 2: Production Container ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy package definitions and install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --frozen-lockfile && npm cache clean --force

# Copy application source code
COPY src/ ./src/

# Use built-in non-root node user for security
USER node

# Expose server port
EXPOSE 5000

# Health check utilizing Node built-in fetch
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/health').then(res => { if (!res.ok) throw new Error(); }).catch(() => process.exit(1))"

# Start application directly using node
CMD ["node", "src/server.js"]
