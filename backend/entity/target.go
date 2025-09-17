package entity

import (
	"gorm.io/gorm"
)

type Target struct {
	gorm.Model
	MaxTarget    float64
	MiddleTarget float64
	MinTarget    float64

	Garbage []Garbage `gorm:"foreignKey: TargetID"`
}

func (t *Target) Validate() (bool, string) {
	// ตรวจค่าไม่ติดลบ
	if t.MaxTarget < 0 {
		return false, "MaxTarget must be non-negative"
	}
	if t.MinTarget < 0 {
		return false, "MinTarget must be non-negative"
	}
	if t.MiddleTarget < 0 {
		return false, "MiddleTarget must be non-negative"
	}

	// ตรวจว่า range ครบ
	if (t.MinTarget != 0 || t.MaxTarget != 0) && (t.MinTarget == 0 || t.MaxTarget == 0) {
		return false, "Incomplete range: both MinTarget and MaxTarget must be set"
	}

	// ตรวจว่า Max >= Min
	if t.MinTarget != 0 && t.MaxTarget != 0 && t.MaxTarget < t.MinTarget {
		return false, "MaxTarget must be greater than or equal to MinTarget"
	}

	// ตรวจว่าถ้าใส่ MiddleTarget ไม่ควรใส่ Range พร้อมกัน (ถ้า logic ต้องการ)
	if t.MiddleTarget != 0 && (t.MinTarget != 0 || t.MaxTarget != 0) {
		return false, "MiddleTarget and Range cannot be set at the same time"
	}

	// ตรวจว่าไม่ได้ปล่อยว่างทั้งหมด
	if t.MiddleTarget == 0 && t.MinTarget == 0 && t.MaxTarget == 0 {
		return false, "At least one target value must be set"
	}

	return true, ""
}