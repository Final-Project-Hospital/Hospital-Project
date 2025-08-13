package entity

import (
	"time"
	"gorm.io/gorm"
)

type Garbage struct {
	gorm.Model
	Date 				time.Time 	`gorm:"column:date"`
	Quantity 			uint  		`gorm:"column:quantity"`
	AADC 				float64	   	`gorm:"column:aadc"`
	MonthlyGarbage 		float64 	`gorm:"column:monthly_garbage"`
	AverageDailyGarbage float64 	`gorm:"column:average_daily_garbage"`
	TotalSale 			float64 	`gorm:"column:total_sale"`
	Note                string		`gorm:"column:note"`

	EnvironmentID uint         `gorm:"column:environment_id"`
	Environment   *Environment `gorm:"foreignKey:EnvironmentID"`

	ParameterID uint       `gorm:"column:parameter_id"`
	Parameter   *Parameter `gorm:"foreignKey:ParameterID"`

	TargetID *uint       `gorm:"column:target_id"`
	Target   *Target  `gorm:"foreignKey:TargetID"`

	UnitID uint     `gorm:"column:unit_id"`
	Unit   *Unit    `gorm:"foreignKey:UnitID"`

	StatusID *uint     `gorm:"column:status_id"`
	Status   *Status    `gorm:"foreignKey:StatusID"`

	EmployeeID uint       `gorm:"column:employee_id"`
	Employee   *Employee  `gorm:"foreignKey:EmployeeID"`
}
