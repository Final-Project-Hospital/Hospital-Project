package entity

import (
	"gorm.io/gorm"
)

type UnitHardware struct {
	gorm.Model
	Unit string `valid:"required~Unit is required"`

	HardwareParameter []HardwareParameter `gorm:"foreignKey:UnitHardwareID" valid:"-"`
}
