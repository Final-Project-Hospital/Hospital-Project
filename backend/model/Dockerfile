FROM python:3.10-slim

# ติดตั้ง dependencies ที่จำเป็นสำหรับ TensorFlow
RUN apt-get update && apt-get install -y \
    build-essential \
    libhdf5-dev \
    && rm -rf /var/lib/apt/lists/*

# ตั้ง working directory
WORKDIR /app

# คัดลอก requirements.txt เข้ามา
COPY requirements.txt .

# ติดตั้ง dependencies
RUN pip install --no-cache-dir -r requirements.txt

# คัดลอกโค้ดทั้งหมดเข้ามา (ในกรณีนี้อยู่ที่ backend/model)
COPY . .

# เปิดพอร์ต Flask
EXPOSE 5000

# รัน Flask service
CMD ["python", "predict_service.py"]
