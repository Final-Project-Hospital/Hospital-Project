package predict

import (
	"bytes"
	"encoding/json"
	"net/http"
	"time"

	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
)


// Predict เป็นฟังก์ชัน Controller ที่ทำหน้าที่เรียก Python เพื่อทำนายเดือนถัดไป
func Predict(c *gin.Context) {
	// 1. คำนวณ month_number ของเดือนถัดไป
	now := time.Now()
	// คำนวณเดือนถัดไป
	nextMonth := now.AddDate(0, 1, 0)
	// แปลงเป็น month_number (ปี * 12 + เดือน)
	nextMonthNumber := nextMonth.Year()*12 + int(nextMonth.Month())

	// 2. สร้างโครงสร้างข้อมูลสำหรับส่งไปให้ Python
	input := entity.PredictInput{
		MonthNumber: nextMonthNumber,
	}
	requestBody, err := json.Marshal(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal request body"})
		return
	}
    
	// 3. ส่ง HTTP POST Request ไปยัง Python Microservice
	resp, err := http.Post("http://localhost:5000/predict", "application/json", bytes.NewBuffer(requestBody))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to prediction service"})
		return
	}
	defer resp.Body.Close()

	// 4. รับและแปลงข้อมูลจาก Python
	var result entity.PredictOutput
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode response from prediction service"})
		return
	}

	c.JSON(http.StatusOK, result)
}