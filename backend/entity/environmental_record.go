package entity

import (
	"github.com/asaskevich/govalidator"
	"gorm.io/gorm"
	"time"
)

type EnvironmentalRecord struct {
	gorm.Model
	Date time.Time `gorm:"column:date" valid:"required~Date is required"`
	Data float64   `gorm:"column:data" valid:"float,optional,dataValid~Data must be >= 0"`
	Note string    `gorm:"column:note"` // optional

	BeforeAfterTreatmentID uint                  `gorm:"column:before_after_treatment_id" valid:"required~BeforeAfterTreatmentID is required"`
	BeforeAfterTreatment   *BeforeAfterTreatment `gorm:"foreignKey:BeforeAfterTreatmentID"`

	EnvironmentID uint         `gorm:"column:environment_id" valid:"required~EnvironmentID is required"`
	Environment   *Environment `gorm:"foreignKey:EnvironmentID"`

	ParameterID uint       `gorm:"column:parameter_id" valid:"required~ParameterID is required"`
	Parameter   *Parameter `gorm:"foreignKey:ParameterID"`

	StandardID uint      `gorm:"column:standard_id" valid:"required~StandardID is required"`
	Standard   *Standard `gorm:"foreignKey:StandardID"`

	UnitID uint  `gorm:"column:unit_id" valid:"required~UnitID is required"`
	Unit   *Unit `gorm:"foreignKey:UnitID"`

	StatusID uint    `gorm:"column:status_id" valid:"required~StatusID is required"`
	Status   *Status `gorm:"foreignKey:StatusID"`

	EmployeeID uint      `gorm:"column:employee_id" valid:"required~EmployeeID is required"`
	Employee   *Employee `gorm:"foreignKey:EmployeeID"`
}

// Custom Validator สำหรับ Data >= 0
func init() {
	govalidator.CustomTypeTagMap.Set("dataValid", govalidator.CustomTypeValidator(func(i interface{}, _ interface{}) bool {
		value, ok := i.(float64)
		if !ok {
			return false
		}
		return value >= 0
	}))
}