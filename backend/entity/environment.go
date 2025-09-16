package entity

import (
	"gorm.io/gorm"
)

type Environment struct {
	gorm.Model
	EnvironmentName string `valid:"required~EnvironmentName is required"`

	EnvironmentalRecord []EnvironmentalRecord `gorm:"foreignKey: EnvironmentID"`
}