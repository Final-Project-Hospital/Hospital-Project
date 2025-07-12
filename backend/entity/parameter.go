package entity

import (
	"gorm.io/gorm"
)

type Parameter struct {
	gorm.Model
	ParameterName	string
	
	EnvironmentalRecord	[]EnvironmentalRecord `gorm:"foreignKey: ParameterID"`
}