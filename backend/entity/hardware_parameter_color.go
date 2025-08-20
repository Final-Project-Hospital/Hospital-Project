package entity

import (
	"gorm.io/gorm"
)

type HardwareParameterColor struct {
	gorm.Model
	Code  string 

	HardwareParameter []HardwareParameter `gorm:"foreignKey:HardwareParameterColorID"`
}