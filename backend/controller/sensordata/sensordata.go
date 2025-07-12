package sensordata

import (
	"net/http"
	"strconv"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
)

func ListDataSensorParameter(c *gin.Context) {
	var sensorDataParameters []entity.SensorDataParameter

	db := config.DB()
	result := db.Preload("SensorData").Preload("HardwareParameter").Find(&sensorDataParameters)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, sensorDataParameters)
}

func ListDataHardwareParameterByParameter(c *gin.Context) {
	parameter := c.Query("parameter")
	if parameter == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parameter is required"})
		return
	}

	var params []entity.HardwareParameter

	db := config.DB()
	result := db.Preload("HardwareGraph").Preload("SensorDataParameter").Preload("HardwareParameterColor").Where("parameter = ?", parameter).Find(&params)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, params)
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
	id := c.Param("id")
	sensorDataID, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID ไม่ถูกต้อง"})
		return
	}

	var parameters []entity.SensorDataParameter

	db := config.DB()
	if err := db.Preload("SensorData").Preload("HardwareParameter").
		Where("sensor_data_id = ?", sensorDataID).
		Find(&parameters).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, parameters)
}
