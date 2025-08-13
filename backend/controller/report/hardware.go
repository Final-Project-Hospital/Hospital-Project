package report

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
)

func ListReportHardware(c *gin.Context) {
	var allReports []entity.SensorDataParameter
	var overStandardReports []entity.SensorDataParameter

	db := config.DB()

	err := db.Preload("HardwareParameter").
		Preload("HardwareParameter.StandardHardware").
		Preload("HardwareParameter.UnitHardware").
		Preload("SensorData").
		Preload("SensorData.Hardware").
		Preload("SensorData.Hardware.Room").
		Preload("SensorData.Hardware.Room.Building").
		Find(&allReports).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// กรองเฉพาะค่าที่เกิน Standard
	for _, report := range allReports {
		if report.HardwareParameter != nil && report.HardwareParameter.StandardHardware != nil {
			if report.Data > report.HardwareParameter.StandardHardware.MaxValueStandard {
				overStandardReports = append(overStandardReports, report)
			}
		}
	}

	c.JSON(http.StatusOK, overStandardReports)
}
