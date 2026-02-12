# Build Stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Install tern for migrations
RUN go install github.com/jackc/tern/v2@latest

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Build application
COPY . .
RUN go build -o server ./cmd/psvault

# Final Stage
FROM alpine:latest

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache ca-certificates tzdata

# Copy binary and tools from builder
COPY --from=builder /app/server .
COPY --from=builder /go/bin/tern /usr/local/bin/tern
COPY --from=builder /app/internal/database/migrations ./internal/database/migrations
COPY entrypoint.sh .

# Set permissions
RUN chmod +x entrypoint.sh

# Expose port
EXPOSE 8080

ENTRYPOINT ["./entrypoint.sh"]
