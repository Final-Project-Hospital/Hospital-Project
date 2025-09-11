package entity

import (
	"gorm.io/gorm"
)

type HardwareGraph struct {
	gorm.Model
	Graph	string

	HardwareParameter []HardwareParameter `gorm:"foreignKey: HardwareGraphID"`
}