package entity

import (
	"gorm.io/gorm"
)

type Standard struct {
	gorm.Model
	MaxValue     float32 
	MiddleValue  float32
	MinValue     float32 
	
	EnvironmentalRecord	[]EnvironmentalRecord `gorm:"foreignKey: StandardID"`
}