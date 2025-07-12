package entity

import (
	"gorm.io/gorm"
)

type HardwareParameter struct {
	gorm.Model
	Parameter	string

	
	HardwareGraphID uint
	HardwareGraph   *HardwareGraph `gorm:"foreignKey: HardwareGraphID"`

	HardwareParameterColorID uint
	HardwareParameterColor   *HardwareParameterColor `gorm:"foreignKey: HardwareParameterColorID"`

	SensorDataParameter	[]SensorDataParameter `gorm:"foreignKey: HardwareParameterID"`
}