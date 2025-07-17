package entity

import (
	"gorm.io/gorm"
)

type Standard struct {
	gorm.Model
	//StandardValue	float32
	MaxValue     float32 
	MiddleValue  float32
	MinValue     float32 
	
	EnvironmentalRecord	[]EnvironmentalRecord `gorm:"foreignKey: StandardID"`
}