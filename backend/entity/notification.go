package entity

import (
	"gorm.io/gorm"
)

type Notification struct {
	gorm.Model
	Name string
	UserID string
}
