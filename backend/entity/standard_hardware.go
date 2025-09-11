package entity

import (
	"gorm.io/gorm"
)

type StandardHardware struct {
	gorm.Model
	MaxValueStandard float64 
	MinValueStandard float64 
	
	HardwareParameter	[]HardwareParameter `gorm:"foreignKey: StandardHardwareID"`
}