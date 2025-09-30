FROM golang:1.23-alpine AS builder

WORKDIR /src

# Cache module download
COPY go.mod go.sum ./
RUN go env -w GOPROXY=https://proxy.golang.org,direct && go mod download

# Copy source and build static binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o /app/server main.go

FROM alpine:3.18
RUN apk add --no-cache ca-certificates

WORKDIR /

# Copy binary from builder
COPY --from=builder /app/server /server

# Create unprivileged user and set ownership
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && chown appuser:appgroup /server
USER appuser

ENV PORT=8000
EXPOSE 8000

ENTRYPOINT ["/server"]