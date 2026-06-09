# Stage 1: Build stage
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

# Disable telemetry during build time
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./

# Install dependencies (use npm install to resolve platform-specific requirements)
RUN --mount=type=cache,target=/root/.npm npm install

COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Leverage Next.js cache mount to speed up build times
RUN --mount=type=cache,target=/usr/src/app/.next/cache npm run build

# Stage 2: Runner stage
FROM node:20-alpine AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

# Create system user and group for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy essential static assets with correct ownership
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /usr/src/app/.next/static ./.next/static

USER nextjs

# The standalone build outputs a minimal server.js file
CMD ["node", "server.js"]
