package entity

import (
	"gorm.io/gorm"
)

type HardwareParameterColor struct {
	gorm.Model
	Code string `valid:"required~Code is required"`

	HardwareParameter []HardwareParameter `gorm:"foreignKey:HardwareParameterColorID" valid:"-"`
}
