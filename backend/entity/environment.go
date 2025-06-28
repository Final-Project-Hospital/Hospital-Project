package entity

import (
	"gorm.io/gorm"
)

type Environment struct {
	gorm.Model
	EnvironmentName	string
	
	EnvironmentalRecord	[]EnvironmentalRecord `gorm:"foreignKey: EnvironmentID"`
}