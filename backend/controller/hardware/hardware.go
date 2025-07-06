package hardware

import (
	"net/http"
	"time"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func ListHardware(c *gin.Context) {
	var hardwares []entity.Hardware

	db := config.DB()
	if err := db.Find(&hardwares).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, hardwares)
}

type SensorInput struct {
	Name   string             `json:"name"`
	Sensor map[string]float64 `json:"sensor"`
}

func ReceiveSensorData(c *gin.Context) {
	var input SensorInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	db := config.DB()

	// 1. เช็กหรือสร้าง Hardware
	var hardware entity.Hardware
	if err := db.Where("name = ?", input.Name).First(&hardware).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			hardware = entity.Hardware{Name: input.Name}
			if err := db.Create(&hardware).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot create hardware: " + err.Error()})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// 2. หา SensorData ของ hardware นี้ (ใช้ล่าสุด)
	var sensorData entity.SensorData
	if err := db.Where("hardware_id = ?", hardware.ID).
		Order("date desc"). // ใช้ล่าสุด
		First(&sensorData).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// ยังไม่มี → สร้างใหม่
			sensorData = entity.SensorData{
				Date:       time.Now(),
				HardwareID: hardware.ID,
			}
			if err := db.Create(&sensorData).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot create SensorData: " + err.Error()})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// 3. วนแต่ละ parameter ที่ส่งมา
	for paramName, value := range input.Sensor {
		var parameter entity.Parameter
		if err := db.Where("parameter_name = ?", paramName).First(&parameter).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				parameter = entity.Parameter{ParameterName: paramName}
				if err := db.Create(&parameter).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot create parameter: " + err.Error()})
					return
				}
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}

		// 4. เพิ่ม SensorDataParameter
		sensorParam := entity.SensorDataParameter{
			Date:          time.Now(),
			Data:          value,
			SensorDataID:  sensorData.ID,
			ParameterID:   parameter.ID,
		}
		if err := db.Create(&sensorParam).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot create SensorDataParameter: " + err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Sensor data saved successfully"})
}
