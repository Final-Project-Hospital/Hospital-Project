package entity

import (
	"time"

	"gorm.io/gorm"
)

type SensorDataParameter struct {
	gorm.Model
	Date time.Time
	Data	float64
	Note string

	SensorDataID	uint
	SensorData	*SensorData `gorm:"foreignKey: SensorDataID"`

	HardwareParameterID	uint
	HardwareParameter	*HardwareParameter `gorm:"foreignKey: HardwareParameterID"`
}