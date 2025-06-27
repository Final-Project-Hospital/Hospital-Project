package entity

import (
	"gorm.io/gorm"
)

type Unit struct {
	gorm.Model
	UnitName	string
	
	EnvironmentalRecord	[]EnvironmentalRecord `gorm:"foreignKey: UnitID"`
}