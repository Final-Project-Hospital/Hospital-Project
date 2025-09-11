package entity

import (
	"gorm.io/gorm"
)

type StandardHardware struct {
	gorm.Model
	MaxValueStandard float64 `valid:"required~MaxValueStandard is required,float~MaxValueStandard must be a number"`
	MinValueStandard float64 `valid:"required~MinValueStandard is required,float~MinValueStandard must be a number"`

	HardwareParameter []HardwareParameter `gorm:"foreignKey:StandardHardwareID" valid:"-"`
}
