package entity

import (
	"gorm.io/gorm"
)

type Status struct {
	gorm.Model
	StatusName	string `valid:"required~StatusName is required"`
	
	EnvironmentalRecord	[]EnvironmentalRecord `gorm:"foreignKey: StatusID"`
}