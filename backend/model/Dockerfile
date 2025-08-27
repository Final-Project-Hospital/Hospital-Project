# backend/model/Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# คัดลอก requirements.txt (ต้องอยู่ใน backend/model/)
COPY requirements.txt .

# สร้าง virtual environment และติดตั้ง dependencies
RUN python -m venv myenv
RUN ./myenv/bin/pip install --upgrade pip
RUN ./myenv/bin/pip install -r requirements.txt

# คัดลอกโค้ด Python ทั้งหมดใน folder model
COPY . ./model

# เปิดพอร์ต (ถ้า service ใช้ API)
EXPOSE 5000

# รัน Python script ผ่าน venv
ENTRYPOINT ["./myenv/bin/python", "model/predict_service.py"]
