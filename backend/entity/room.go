package entity

import (
	"gorm.io/gorm"
)

type Room struct {
	gorm.Model
	RoomName string
	Floor    int
	Icon     string `gorm:"type:text"`

	BuildingID uint
	Building   *Building `gorm:"foreignKey: BuildingID"`

	EmployeeID uint
	Employee   *Employee `gorm:"foreignKey: EmployeeID"`

	HardwareID uint
	Hardware   *Hardware `gorm:"foreignKey: HardwareID"`

	RoomNotification []RoomNotification `gorm:"foreignKey: RoomID"`
}
