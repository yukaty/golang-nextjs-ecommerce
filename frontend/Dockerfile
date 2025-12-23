# --- 1. Build Stage ---
FROM node:22-alpine AS builder
LABEL stage=builder

# Set working directory
WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy all source files to the container
COPY next.config.* ./
COPY public ./public
COPY src ./src
COPY tsconfig.json ./
COPY postcss.config.mjs ./

# Set build-time environment variables
ARG API_BASE_URL
ENV API_BASE_URL=${API_BASE_URL}

# Build the Next.js application
RUN npm run build


# --- 2. Run Stage ---
FROM node:22-alpine AS runner

# Set working directory
WORKDIR /app

# Set runtime environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary files from the build stage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Use a non-root user to run the application
USER node

# The port the application will listen on
EXPOSE 3000

# Run the Next.js application
CMD ["node", "server.js"]