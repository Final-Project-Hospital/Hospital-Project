FROM golang:1.25-alpine AS build
WORKDIR /app

# คัดลอกไฟล์ go.mod / go.sum
COPY go.mod go.sum ./

RUN go mod download

# คัดลอก source code
COPY . .
RUN go build -o main main.go
CMD ["./main"]
EXPOSE 8000
