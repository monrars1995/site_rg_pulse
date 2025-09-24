# Multi-stage build for React + Node.js application
FROM --platform=$BUILDPLATFORM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies for both frontend and backend
RUN npm install
RUN cd server && npm install

# Copy source code
COPY . .

# Remove package-lock.json and node_modules to fix rollup issue
RUN rm -f package-lock.json
RUN rm -rf node_modules

# Reinstall dependencies and build
RUN npm install
RUN npm run build

# Production stage
FROM --platform=$TARGETPLATFORM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy server package files and install production dependencies
COPY server/package*.json ./
RUN npm install --only=production

# Copy server source code
COPY server/ ./

# Copy built React app from builder stage
COPY --from=builder /app/dist ./public

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "server.js"]