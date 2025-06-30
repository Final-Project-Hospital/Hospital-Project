package sensordata

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
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
