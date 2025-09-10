package entity

import (
	"gorm.io/gorm"
)

type LineMaster struct {
	gorm.Model
	Token string `valid:"required~Token is required"`

	EmployeeID *uint    `valid:"required~EmployeeID is required"`
	Employee   Employee `gorm:"foreignKey:EmployeeID" valid:"-"`
}
