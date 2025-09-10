package entity

import (
	"time"
	"gorm.io/gorm"
)

type SensorData struct {
	gorm.Model
	Date time.Time `valid:"required~Date is required"`

	HardwareID uint      `valid:"required~HardwareID is required"`
	Hardware   *Hardware `gorm:"foreignKey:HardwareID" valid:"-"`

	SensorDataParameter []SensorDataParameter `gorm:"foreignKey:SensorDataID" valid:"-"`
}
