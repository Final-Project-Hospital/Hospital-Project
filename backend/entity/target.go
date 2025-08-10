package entity

import (
	"gorm.io/gorm"
)

type Target struct {
	gorm.Model
	MaxTarget     float64 
	MiddleTarget  float64
	MinTarget     float64 
	
	Garbage	[]Garbage `gorm:"foreignKey: TargetID"`
}