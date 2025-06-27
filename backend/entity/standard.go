package entity

import (
	"gorm.io/gorm"
)

type Standard struct {
	gorm.Model
	StandardValue	float32
	
	EnvironmentalRecord	[]EnvironmentalRecord `gorm:"foreignKey: StandardID"`
}