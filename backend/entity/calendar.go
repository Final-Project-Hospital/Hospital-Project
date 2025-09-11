package entity

import (
	"gorm.io/gorm"
	"time"
)

type Calendar struct {
	gorm.Model
	Title       string `valid:"required~Title is required,length(1|100)~Title must be between 1 and 100 characters"`
	Location    string `valid:"required~Location is required"`
	Description string `valid:"required~Description is required"`
	StartDate   time.Time `valid:"required~Start date is required"`
	EndDate     time.Time `valid:"required~End date is required"`

	EmployeeID *uint `valid:"required~EmployeeID is required"`
	Employee   Employee `gorm:"foreignKey:EmployeeID" valid:"-"`
}
