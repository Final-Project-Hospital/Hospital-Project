package unit

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/Tawunchai/hospital-project/entity"
)

func TestValidGarbage(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.Garbage{
		Date:                time.Now(),
		Quantity:            100,
		AADC:                12.5,
		MonthlyGarbage:      300.0,
		AverageDailyGarbage: 10.0,
		TotalSale:           500.5,
		Note:                "Normal garbage record",
		EnvironmentID:       1,
		ParameterID:         1,
		TargetID:            nil,
		UnitID:              1,
		StatusID:            nil,
		EmployeeID:          1,
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

// Date
func TestInvalidGarbageDate(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.Garbage{
		Date:          time.Time{}, // ว่าง
		Quantity:      10,
		AADC:          5.0,
		EnvironmentID: 1,
		ParameterID:   1,
		UnitID:        1,
		EmployeeID:    1,
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Date is required"))
}

// Quantity
func TestInvalidGarbageQuantityNegative(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.Garbage{
		Date:          time.Now(),
		Quantity:      10, // 0 ก็ valid
		AADC:          5.0,
		EnvironmentID: 1,
		ParameterID:   1,
		UnitID:        1,
		EmployeeID:    1,
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

// Numeric fields ติดลบ = fail
func TestInvalidGarbageNegativeValues(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.Garbage{
		Date:                time.Now(),
		Quantity:            10,
		AADC:                -1.0,
		MonthlyGarbage:      -5.0,
		AverageDailyGarbage: -2.0,
		TotalSale:           -100.0,
		EnvironmentID:       1,
		ParameterID:         1,
		UnitID:              1,
		EmployeeID:          1,
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
}

// EnvironmentID
func TestInvalidGarbageEnvironmentID(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.Garbage{
		Date:          time.Now(),
		Quantity:      10,
		AADC:          5,
		EnvironmentID: 0, // ไม่มี ID
		ParameterID:   1,
		UnitID:        1,
		EmployeeID:    1,
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("EnvironmentID is required"))
}

// ParameterID
func TestInvalidGarbageParameterID(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.Garbage{
		Date:          time.Now(),
		Quantity:      10,
		AADC:          5,
		EnvironmentID: 1,
		ParameterID:   0, // ไม่มี ID
		UnitID:        1,
		EmployeeID:    1,
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("ParameterID is required"))
}

// UnitID
func TestInvalidGarbageUnitID(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.Garbage{
		Date:          time.Now(),
		Quantity:      10,
		AADC:          5,
		EnvironmentID: 1,
		ParameterID:   1,
		UnitID:        0, // ไม่มี ID
		EmployeeID:    1,
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("UnitID is required"))
}

// EmployeeID
func TestInvalidGarbageEmployeeID(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.Garbage{
		Date:          time.Now(),
		Quantity:      10,
		AADC:          5,
		EnvironmentID: 1,
		ParameterID:   1,
		UnitID:        1,
		EmployeeID:    0, // ไม่มี ID
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("EmployeeID is required"))
}

// Note สามารถว่างได้
func TestValidGarbageWithoutNote(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.Garbage{
		Date:          time.Now(),
		Quantity:      10,
		AADC:          5,
		EnvironmentID: 1,
		ParameterID:   1,
		UnitID:        1,
		EmployeeID:    1,
		Note:          "",
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

// TargetID สามารถว่าง (nil) หรือใส่ค่า valid
func TestValidGarbageWithTargetID(t *testing.T) {
	g := NewGomegaWithT(t)

	targetID := uint(1)
	record := entity.Garbage{
		Date:          time.Now(),
		Quantity:      10,
		AADC:          5,
		EnvironmentID: 1,
		ParameterID:   1,
		UnitID:        1,
		EmployeeID:    1,
		TargetID:      &targetID,
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

// StatusID สามารถว่าง (nil) หรือใส่ค่า valid
func TestValidGarbageWithStatusID(t *testing.T) {
	g := NewGomegaWithT(t)

	statusID := uint(1)
	record := entity.Garbage{
		Date:          time.Now(),
		Quantity:      10,
		AADC:          5,
		EnvironmentID: 1,
		ParameterID:   1,
		UnitID:        1,
		EmployeeID:    1,
		StatusID:      &statusID,
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

// TargetID และ StatusID เป็น nil ก็ valid
func TestValidGarbageWithoutTargetAndStatus(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.Garbage{
		Date:          time.Now(),
		Quantity:      10,
		AADC:          5,
		EnvironmentID: 1,
		ParameterID:   1,
		UnitID:        1,
		EmployeeID:    1,
		TargetID:      nil,
		StatusID:      nil,
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}
