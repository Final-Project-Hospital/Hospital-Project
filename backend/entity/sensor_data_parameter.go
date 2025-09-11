package entity

import (
	"time"

	"gorm.io/gorm"
)

type SensorDataParameter struct {
	gorm.Model
	Date time.Time `valid:"required~Date is required"`
	Data float64   `valid:"required~Data is required"`
	Note string    // ไม่ต้อง validate

	SensorDataID uint        `valid:"required~SensorDataID is required"`
	SensorData   *SensorData `gorm:"foreignKey:SensorDataID" valid:"-"`

	HardwareParameterID uint               `valid:"required~HardwareParameterID is required"`
	HardwareParameter   *HardwareParameter `gorm:"foreignKey:HardwareParameterID" valid:"-"`
}
