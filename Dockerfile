# Build stage
FROM node:18.13.0-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run test
RUN npm run tsc

# Production stage
FROM node:18.13.0-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
COPY pm2.config.js ./
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Clean up npm cache
RUN npm cache clean --force

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

CMD [ "npm", "run", "pm2" ]