package entity

import (
	"gorm.io/gorm"
)

type Building struct {
	gorm.Model
	BuildingName string   `valid:"required~BuildingName is required"`

	EmployeeID *uint     `valid:"required~EmployeeID is required"`
	Employee   Employee  `gorm:"foreignKey:EmployeeID" valid:"-"`

	Room []Room `gorm:"foreignKey:BuildingID" valid:"-"`
}