package entity

import (
	"time"
	"gorm.io/gorm"
)

type EnvironmentalRecord struct {
	gorm.Model
	Date	time.Time
	Data	float32

	BeforeAfterTreatmentID	uint
	BeforeAfterTreatment	*BeforeAfterTreatment `gorm:"foreignKey: BeforeAfterTreatmentID"`

	EnvironmentID	uint
	Environment		*Environment `gorm:"foreignKey: EnvironmentID"`

	ParameterID	uint
	Parameter   *Parameter `gorm:"foreignKey: ParameterID"`

	StandardID	uint
	Standard	*Standard `gorm:"foreignKey: StandardID"`

	UnitID	uint
	Unit	*Unit `gorm:"foreignKey: UnitID"`

	EmployeeID	uint
	Employee	*Employee `gorm:"foreignKey: EmployeeID"`
}