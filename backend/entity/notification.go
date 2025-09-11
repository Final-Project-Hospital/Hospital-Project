package entity

import (
	"gorm.io/gorm"
)

type Notification struct {
	gorm.Model
	Name   string `valid:"required~Name is required"`
	UserID string `valid:"required~UserID is required"`
	Alert  bool   

	RoomNotification []RoomNotification `gorm:"foreignKey:NotificationID" valid:"-"`
}
