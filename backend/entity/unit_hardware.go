package entity

import (
	"gorm.io/gorm"
)

type UnitHardware struct {
	gorm.Model
	Unit	string
	HardwareParameter	[]HardwareParameter `gorm:"foreignKey: UnitHardwareID"`
}