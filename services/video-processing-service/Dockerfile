FROM golang:1.21-alpine AS builder

# Install FFmpeg and build dependencies
RUN apk add --no-cache ffmpeg git build-base

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o video-processing-service ./cmd/main.go

FROM alpine:latest

# Install FFmpeg runtime
RUN apk --no-cache add ffmpeg ca-certificates

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/video-processing-service .

# Create temp directory for video processing
RUN mkdir -p /tmp/video-processing

EXPOSE 8081

CMD ["./video-processing-service"]