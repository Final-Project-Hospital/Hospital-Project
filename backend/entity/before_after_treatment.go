package entity

import (
	"gorm.io/gorm"
)

type BeforeAfterTreatment struct {
	gorm.Model
	TreatmentName	string `valid:"required~TreatmentName is required"`
	
	EnvironmentalRecord	[]EnvironmentalRecord `gorm:"foreignKey: BeforeAfterTreatmentID"`
}