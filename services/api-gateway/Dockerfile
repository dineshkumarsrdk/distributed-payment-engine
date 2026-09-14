# Stage 1: Base Image
FROM node:24-alpine AS base
WORKDIR /usr/src/app
# Stage 2: Dependencies
# Copy package files first to leverage Docker layer caching
COPY package.json package-lock.json ./
RUN npm ci --only=production
# Stage 3: Production Build
FROM node:24-alpine AS production
WORKDIR /usr/src/app
# Copy production node_modules from the dependencies stage
COPY --from=base /usr/src/app/node_modules ./node_modules
# Copy application source code
COPY . .
# Run the application as a non-root user for better security
USER node
# Start the application
CMD ["node", "src/server.js"]