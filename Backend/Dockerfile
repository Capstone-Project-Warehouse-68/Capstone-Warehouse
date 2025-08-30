FROM golang:1.23

WORKDIR /app

# Copy only go.mod and go.sum first (เพื่อแคช)
COPY Backend/go.mod . 
COPY Backend/go.sum .

# Download dependencies only (หาก go.mod/go.sum ไม่เปลี่ยน จะใช้ cache)
RUN go mod tidy

# Copy source code ทั้งหมด
COPY Backend/ .

# Build
RUN go build -o main .

EXPOSE 8002
CMD ["./main"]