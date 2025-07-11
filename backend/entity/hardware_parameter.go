package entity

import (
	"gorm.io/gorm"
)

type HardwareParameter struct {
	gorm.Model
	Parameter	string

	SensorDataParameter	[]SensorDataParameter `gorm:"foreignKey: HardwareParameterID"`
}