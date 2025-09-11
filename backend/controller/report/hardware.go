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

	// กรองเฉพาะค่าที่เกินหรือ ต่ำกว่ามาตรฐาน
	for _, report := range allReports {
		if report.HardwareParameter != nil && report.HardwareParameter.StandardHardware != nil {
			std := report.HardwareParameter.StandardHardware

			// ถ้า Max หรือ Min = 0 ให้ข้าม
			isOver := std.MaxValueStandard != 0 && report.Data > std.MaxValueStandard
			isUnder := std.MinValueStandard != 0 && report.Data < std.MinValueStandard

			if isOver || isUnder {
				overStandardReports = append(overStandardReports, report)
			}
		}
	}

	c.JSON(http.StatusOK, overStandardReports)
}

