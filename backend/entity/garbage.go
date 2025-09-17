package entity

import (
	"gorm.io/gorm"
	"time"
)

type Garbage struct {
	gorm.Model
	Date                time.Time `gorm:"column:date" valid:"required~Date is required"`
	Quantity            uint      `gorm:"column:quantity"`
	AADC                float64   `gorm:"column:aadc" valid:"float,optional,range(0|1000000)~AADC must be non-negative"`
	MonthlyGarbage      float64   `gorm:"column:monthly_garbage" valid:"float,optional,range(0|1000000)~MonthlyGarbage must be non-negative"`
	AverageDailyGarbage float64   `gorm:"column:average_daily_garbage" valid:"float,optional,range(0|1000000)~AverageDailyGarbage must be non-negative"`
	TotalSale           float64   `gorm:"column:total_sale" valid:"float,optional,range(0|1000000)~TotalSale must be non-negative"`
	Note                string    `gorm:"column:note"`

	EnvironmentID uint         `gorm:"column:environment_id" valid:"required~EnvironmentID is required"`
	Environment   *Environment `gorm:"foreignKey:EnvironmentID"`

	ParameterID uint       `gorm:"column:parameter_id" valid:"required~ParameterID is required"`
	Parameter   *Parameter `gorm:"foreignKey:ParameterID"`

	TargetID *uint   `gorm:"column:target_id"`
	Target   *Target `gorm:"foreignKey:TargetID"`

	UnitID uint  `gorm:"column:unit_id" valid:"required~UnitID is required"`
	Unit   *Unit `gorm:"foreignKey:UnitID"`

	StatusID *uint   `gorm:"column:status_id"`
	Status   *Status `gorm:"foreignKey:StatusID"`

	EmployeeID uint      `gorm:"column:employee_id" valid:"required~EmployeeID is required"`
	Employee   *Employee `gorm:"foreignKey:EmployeeID"`
}