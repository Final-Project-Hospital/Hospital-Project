package entity

import (
	"time"
	"gorm.io/gorm"
)

type EnvironmentalRecord struct {
	gorm.Model
	Date time.Time `gorm:"column:date"`
	Data float32   `gorm:"column:data"`
	
	comment string

	BeforeAfterTreatmentID uint                  `gorm:"column:before_after_treatment_id"`
	BeforeAfterTreatment   *BeforeAfterTreatment `gorm:"foreignKey:BeforeAfterTreatmentID"`

	EnvironmentID uint         `gorm:"column:environment_id"`
	Environment   *Environment `gorm:"foreignKey:EnvironmentID"`

	ParameterID uint       `gorm:"column:parameter_id"`
	Parameter   *Parameter `gorm:"foreignKey:ParameterID"`

	StandardID uint       `gorm:"column:standard_id"`
	Standard   *Standard  `gorm:"foreignKey:StandardID"`

	UnitID uint     `gorm:"column:unit_id"`
	Unit   *Unit    `gorm:"foreignKey:UnitID"`

	EmployeeID uint       `gorm:"column:employee_id"`
	Employee   *Employee  `gorm:"foreignKey:EmployeeID"`
}
