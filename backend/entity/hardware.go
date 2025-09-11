package entity

import (
	"gorm.io/gorm"
)

type Hardware struct {
	gorm.Model
	Name       string `valid:"required~Name is required"`
	MacAddress string `valid:"required~MacAddress is required"`

	Room []Room `gorm:"foreignKey:HardwareID" valid:"-"`
	SensorData []SensorData `gorm:"foreignKey:HardwareID" valid:"-"`
}
