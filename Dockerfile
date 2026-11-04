# syntax=docker/dockerfile:1

FROM golang:1.26-alpine AS builder

WORKDIR /src
ENV CGO_ENABLED=0
ENV GOOS=linux
ENV GOARCH=amd64
ENV GOTOOLCHAIN=auto

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./
RUN go build -trimpath -ldflags="-s -w" -o /out/reorderflow ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /app
COPY --from=builder /out/reorderflow /app/reorderflow

EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/app/reorderflow"]
