# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install curl for health checking, and clean apk caches
RUN apk add --no-cache curl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production

# Copy built assets and compiled outputs from builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 5000

# Run container in sandboxed security scopes (non-root Node user)
USER node

CMD ["node", "dist/server.js"]
