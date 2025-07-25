package entity

import (
	"gorm.io/gorm"
)

type StandardHardware struct {
	gorm.Model
	Standard float64 
	
	HardwareParameter	[]HardwareParameter `gorm:"foreignKey: StandardHardwareID"`
}