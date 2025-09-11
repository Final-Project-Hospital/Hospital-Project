package entity

import (
	"gorm.io/gorm"
)

type RoomNotification struct {
	gorm.Model

	RoomID uint  `valid:"required~RoomID is required"`
	Room   *Room `gorm:"foreignKey:RoomID" valid:"-"`

	NotificationID uint          `valid:"required~NotificationID is required"`
	Notification   *Notification `gorm:"foreignKey:NotificationID" valid:"-"`
}
