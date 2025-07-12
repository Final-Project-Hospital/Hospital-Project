package entity

import (
	"gorm.io/gorm"
)

type HardwareParameter struct {
	gorm.Model
	Parameter	string

	
	HardwareGraphID uint
	HardwareGraph   *HardwareGraph `gorm:"foreignKey: HardwareGraphID"`

	SensorDataParameter	[]SensorDataParameter `gorm:"foreignKey: HardwareParameterID"`
}