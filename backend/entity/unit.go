package entity

import (
	"gorm.io/gorm"
)

type Unit struct {
	gorm.Model
	UnitName string `valid:"required~UnitName is required"`

	EnvironmentalRecord []EnvironmentalRecord `gorm:"foreignKey:UnitID"`
}