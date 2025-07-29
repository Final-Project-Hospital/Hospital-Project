package hardware

import (
	"net/http"
	"time"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
)

type ParameterWithData struct {
	Parameter string  `json:"parameter" binding:"required"`
	Data      float64 `json:"data" binding:"required"`
}

type HardwareInput struct {
	Name       string              `json:"name" binding:"required"`
	IpAddress  string              `json:"ip_address" binding:"required"`
	Parameters []ParameterWithData `json:"parameters" binding:"required"`
}

func ReadDataForHardware(c *gin.Context) {
	var input HardwareInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	db := config.DB()

	// 1. หา/สร้าง Hardware
	var hardware entity.Hardware
	if err := db.Where("name = ? AND ip_address = ?", input.Name, input.IpAddress).First(&hardware).Error; err != nil {
		hardware = entity.Hardware{Name: input.Name, IpAddress: input.IpAddress}
		if err := db.Create(&hardware).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create hardware"})
			return
		}
	}

	// 2. หา/สร้าง SensorData
	var sensorData entity.SensorData
	if err := db.Where("hardware_id = ?", hardware.ID).First(&sensorData).Error; err != nil {
		sensorData = entity.SensorData{Date: time.Now(), HardwareID: hardware.ID}
		if err := db.Create(&sensorData).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create sensor data"})
			return
		}
	}

	// 3. ดึง HardwareParameter ทั้งหมด
	var allParams []entity.HardwareParameter
	if err := db.Find(&allParams).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch hardware parameters"})
		return
	}

	var createdSDPs []entity.SensorDataParameter
	var createdParamIDs []uint

	for _, p := range input.Parameters {
		var hp entity.HardwareParameter
		needNew := true

		for _, ap := range allParams {
			if ap.Parameter == p.Parameter {
				// ตรวจว่าใช้ใน SensorData ของ Hardware อื่นหรือไม่
				var count int64
				db.Model(&entity.SensorDataParameter{}).
					Joins("JOIN sensor_data ON sensor_data.id = sensor_data_parameters.sensor_data_id").
					Where("sensor_data_parameters.hardware_parameter_id = ? AND sensor_data.hardware_id != ?", ap.ID, hardware.ID).
					Count(&count)
				if count == 0 {
					hp = ap
					needNew = false
					break
				}
			}
		}

		if needNew {
			std := entity.StandardHardware{Standard: 0.0}
			unit := entity.UnitHardware{Unit: ""}
			if err := db.Create(&std).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create standard"})
				return
			}
			if err := db.Create(&unit).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create unit"})
				return
			}
			hp = entity.HardwareParameter{
				Parameter:                p.Parameter,
				StandardHardwareID:       std.ID,
				UnitHardwareID:           unit.ID,
				HardwareGraphID:          1,
				HardwareParameterColorID: 1,
				Icon:                     "GiChemicalDrop",
			}
			if err := db.Create(&hp).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create hardware parameter"})
				return
			}
			allParams = append(allParams, hp)
		}

		// เพิ่มข้อมูลใหม่เสมอ แม้จะมี SensorDataParameter เดิม
		sdp := entity.SensorDataParameter{
			Date:                time.Now(),
			Data:                p.Data,
			SensorDataID:        sensorData.ID,
			HardwareParameterID: hp.ID,
		}
		if err := db.Create(&sdp).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create sensor data parameter"})
			return
		}
		createdParamIDs = append(createdParamIDs, hp.ID)
		createdSDPs = append(createdSDPs, sdp)
	}

	c.JSON(http.StatusOK, gin.H{
		"hardware":               hardware,
		"sensor_data_id":         sensorData.ID,
		"created_parameter_ids":  createdParamIDs,
		"sensor_data_parameters": createdSDPs,
	})
}
