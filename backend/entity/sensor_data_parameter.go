package entity

import (
	"time"

	"gorm.io/gorm"
)

type SensorDataParameter struct {
	gorm.Model
	Date time.Time
	Data	float64

	SensorDataID	uint
	SensorData	*SensorData `gorm:"foreignKey: SensorDataID"`

	ParameterID	uint
	Parameter	*Parameter `gorm:"foreignKey: ParameterID"`
}