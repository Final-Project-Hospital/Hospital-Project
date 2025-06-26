package entity

import (
	"gorm.io/gorm"
)

type BeforeAfterTreatment struct {
	gorm.Model
	TreatmentName	string
	
	EnvironmentalRecord	[]EnvironmentalRecord `gorm:"foreignKey: BeforeAfterTreatmentID"`
}