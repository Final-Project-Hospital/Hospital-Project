package entity

import (
	"gorm.io/gorm"
)

type Hardware struct {
	gorm.Model
	Name string
	IpAddress	string

	Room []Room `gorm:"foreignKey: HardwareID"`

	SensorData []SensorData `gorm:"foreignKey: HardwareID"`
}