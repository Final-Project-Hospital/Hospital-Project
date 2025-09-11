package entity

import (
	"time"
	"gorm.io/gorm"
)

type SensorData struct {
	gorm.Model
	Date	time.Time

	HardwareID	uint
	Hardware	*Hardware `gorm:"foreignKey: HardwareID"`

	SensorDataParameter	[]SensorDataParameter `gorm:"foreignKey: SensorDataID"`
}