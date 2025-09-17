package entity

import (
	"gorm.io/gorm"
)

type Parameter struct {
	gorm.Model
	ParameterName	string `valid:"required~ParameterName is required"`
	
	EnvironmentalRecord	[]EnvironmentalRecord `gorm:"foreignKey: ParameterID"`
}