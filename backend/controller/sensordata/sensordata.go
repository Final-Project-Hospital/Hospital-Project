package sensordata

import (
	"net/http"
	"strconv"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
)

func ListDataSensorParameter(c *gin.Context) {
	var SensorDataParameters []entity.SensorDataParameter

	db := config.DB()
	result := db.Preload("SensorData").Preload("Parameter").Find(&SensorDataParameters)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, SensorDataParameters)
}

func GetSensorDataIDByHardwareID(c *gin.Context) {
	id := c.Param("id")
	hardwareID, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID ไม่ถูกต้อง"})
		return
	}

	var sensorDataList []entity.SensorData

	db := config.DB()
	if err := db.Where("hardware_id = ?", hardwareID).
		Preload("Hardware").
		Find(&sensorDataList).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if len(sensorDataList) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "ไม่พบ SensorData สำหรับ Hardware นี้"})
		return
	}

	c.JSON(http.StatusOK, sensorDataList)
}

func GetSensorDataParametersBySensorDataID(c *gin.Context) {
	id := c.Param("id") // รับ ID จาก URL
	sensorDataID, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID ไม่ถูกต้อง"})
		return
	}

	var parameters []entity.SensorDataParameter

	db := config.DB()
	if err := db.Preload("SensorData").Preload("Parameter").
		Where("sensor_data_id = ?", sensorDataID).
		Find(&parameters).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, parameters)
}
