package entity

import (
	"gorm.io/gorm"
)

type SensorDataParameter struct {
	gorm.Model
	Data	float32

	SensorDataID	uint
	SensorData	*SensorData `gorm:"foreignKey: SensorDataID"`

	ParameterID	uint
	Parameter	*Parameter `gorm:"foreignKey: ParameterID"`
}