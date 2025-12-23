# --- 1. Build Stage ---
FROM golang:1.25-alpine AS builder
LABEL stage=builder

# Install necessary packages
RUN apk update && apk add --no-cache git ca-certificates tzdata && update-ca-certificates

# Set the timezone
WORKDIR /app

# Download Go modules first to leverage Docker layer caching
COPY go.mod go.sum ./
RUN go mod download

# Copy the entire application source code
COPY . .

# Build the Go application
# Options explained:
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/server ./cmd/server/main.go

# --- 2. Runtime Stage ---
FROM alpine:latest

# Install necessary packages for runtime
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Set the timezone
ENV TZ=America/Vancouver

# Set working directory
WORKDIR /app

# Copy the built binaries and necessary files from the builder stage
COPY --from=builder /app/server /app/server
COPY --from=builder /app/db /app/db
COPY --from=builder /app/uploads /app/uploads

# Manage environment variables using Cloud Run settings
# COPY .env .env

# Expose the application port (Cloud Run expects 8080 by default)
EXPOSE 8080

# Run the application
CMD ["/app/server"]

