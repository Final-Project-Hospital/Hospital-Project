package entity

import (
	"gorm.io/gorm"
)

type Room struct {
	gorm.Model
	RoomName	string
	Floor		int

	BuildingID	uint
	Building	*Building `gorm:"foreignKey: BuildingID"`

	UserID	uint
	User	*User `gorm:"foreignKey: UserID"`

	Hardware []Hardware `gorm:"foreignKey: RoomID"`
}