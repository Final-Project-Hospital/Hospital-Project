package entity

import (
	
	"gorm.io/gorm"
)

type RoomNotification struct {
	gorm.Model

	RoomID uint
	Room   *Room `gorm:"foreignKey:RoomID"`
	
	NotificationID uint
	Notification   *Notification `gorm:"foreignKey:NotificationID"`
}