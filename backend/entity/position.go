package entity

import (
	"gorm.io/gorm"
)

type Position struct {
	gorm.Model
	Position string `valid:"required~Position is required"`

	Employee []Employee `gorm:"foreignKey:PositionID" valid:"-"`
}
