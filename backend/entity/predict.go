package entity

import (
	"gorm.io/gorm"
)

type PredictInput struct {
	gorm.Model
	MonthNumber int `json:"month_number"`
}

// PredictOutput เป็นโครงสร้างสำหรับข้อมูลที่จะส่งกลับไป Frontend
type PredictOutput struct {
	gorm.Model
	Prediction float32 `json:"prediction"`
}