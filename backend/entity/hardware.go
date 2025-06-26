package entity

import (
	"gorm.io/gorm"
)

type Hardware struct {
	gorm.Model
	IpAddress	string

	RoomID	uint
	Room	*Room `gorm:"foreignKey: RoomID"`
	
	SensorData []SensorData `gorm:"foreignKey: HardwareID"`
}