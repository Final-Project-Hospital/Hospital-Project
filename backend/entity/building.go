package entity

import (
	"gorm.io/gorm"
)

type Building struct {
	gorm.Model
	BuildingName	string
	
	Room []Room `gorm:"foreignKey: BuildingID"`
}