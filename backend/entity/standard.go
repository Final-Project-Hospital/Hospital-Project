package entity

import (
	"gorm.io/gorm"
)

type Standard struct {
	gorm.Model
	MaxValue    float32 `gorm:"column:max_value"`
	MiddleValue float32 `gorm:"column:middle_value"`
	MinValue    float32 `gorm:"column:min_value"`

	EnvironmentalRecord []EnvironmentalRecord `gorm:"foreignKey:StandardID"`
}

// Validate ตรวจสอบ field ของ Standard
func (s *Standard) Validate() (bool, string) {
	// ตรวจค่าต้องไม่ติดลบ
	if s.MaxValue < 0 {
		return false, "MaxValue must be non-negative"
	}
	if s.MinValue < 0 {
		return false, "MinValue must be non-negative"
	}
	if s.MiddleValue < 0 {
		return false, "MiddleValue must be non-negative"
	}

	// ตรวจว่าค่าช่วงครบทั้ง MinValue และ MaxValue
	if (s.MinValue != 0 || s.MaxValue != 0) && (s.MinValue == 0 || s.MaxValue == 0) {
		return false, "Incomplete range: both MinValue and MaxValue must be set"
	}

	// ตรวจว่า MaxValue >= MinValue
	if s.MinValue != 0 && s.MaxValue != 0 && s.MaxValue < s.MinValue {
		return false, "MaxValue must be greater than or equal to MinValue"
	}

	// ตรวจว่า MiddleValue และ Range ไม่สามารถใส่พร้อมกัน
	if s.MiddleValue != 0 && (s.MinValue != 0 || s.MaxValue != 0) {
		return false, "MiddleValue and range cannot be set at the same time"
	}

	// ตรวจว่ามีค่า Standard อย่างน้อยหนึ่งค่า
	if s.MiddleValue == 0 && s.MinValue == 0 && s.MaxValue == 0 {
		return false, "At least one Standard value must be set"
	}

	return true, ""
}