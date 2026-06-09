# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy dependency catalogs and schema
COPY package*.json ./
COPY prisma ./prisma/

# Leverage npm cache mount for faster downloads
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy application source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

# Stage 2: Runner stage
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Copy dependency catalogs and schema
COPY package*.json ./
COPY prisma ./prisma/

# Leverage npm cache mount and install only production dependencies
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

# Copy compiled JavaScript files from builder
COPY --from=builder /usr/src/app/dist ./dist

# Copy generated Prisma Client from builder to keep db client access
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma/client ./node_modules/@prisma/client

# Set runtime environment
ENV NODE_ENV=production
ENV PORT=5000

# Expose backend port
EXPOSE 5000

# Run migrations and start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/server.js"]
