FROM golang:1.25-alpine AS build
WORKDIR /app

# คัดลอกไฟล์ go.mod / go.sum
COPY go. * ./
RUN go mod download

# คัดลอก source code
COPY . .
RUN go build -o main main.go
EXPOSE 8000
