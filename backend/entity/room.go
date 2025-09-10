package entity

import (
	"gorm.io/gorm"
)

type Room struct {
	gorm.Model
	RoomName string `valid:"required~RoomName is required"`
	Floor    int    `valid:"required~Floor is required,int~Floor must be an integer"`
	Icon     string `gorm:"type:text" valid:"required~Icon is required"`

	BuildingID uint      `valid:"required~BuildingID is required"`
	Building   *Building `gorm:"foreignKey:BuildingID" valid:"-"`

	EmployeeID uint      `valid:"required~EmployeeID is required"`
	Employee   *Employee `gorm:"foreignKey:EmployeeID" valid:"-"`

	HardwareID uint      `valid:"required~HardwareID is required"`
	Hardware   *Hardware `gorm:"foreignKey:HardwareID" valid:"-"`

	RoomNotification []RoomNotification `gorm:"foreignKey:RoomID" valid:"-"`
}
