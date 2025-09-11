package entity

import (
	"gorm.io/gorm"
)

type HardwareGraph struct {
	gorm.Model
	Graph string `valid:"required~Graph is required"`

	HardwareParameter []HardwareParameter `gorm:"foreignKey:HardwareGraphID" valid:"-"`
}
