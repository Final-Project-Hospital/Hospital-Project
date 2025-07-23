package entity

import (
	"gorm.io/gorm"
)

type Status struct {
	gorm.Model
	StatusName	string
	
	EnvironmentalRecord	[]EnvironmentalRecord `gorm:"foreignKey: StatusID"`
}