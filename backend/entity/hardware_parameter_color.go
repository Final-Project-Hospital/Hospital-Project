package entity

import (
	"gorm.io/gorm"
)

type HardwareParameterColor struct {
	gorm.Model
	Color string 
	Code  string 

	HardwareParameter []HardwareParameter `gorm:"foreignKey:HardwareParameterColorID"`
}