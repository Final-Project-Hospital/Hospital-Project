package unit

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/Tawunchai/hospital-project/entity"
)

func TestValidEnvironmentalRecord(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.EnvironmentalRecord{
		Date:                  time.Now(),
		Data:                  7.5,
		Note:                  "pH value normal",
		BeforeAfterTreatmentID: 1,
		EnvironmentID:         1,
		ParameterID:           1,
		StandardID:            1,
		UnitID:                1,
		StatusID:              1,
		EmployeeID:            1,
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

// Date
func TestInvalidEnvironmentalRecordDate(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.EnvironmentalRecord{
		Date:                  time.Time{}, // ว่าง
		Data:                  7.5,
		Note:                  "pH value normal",
		BeforeAfterTreatmentID: 1,
		EnvironmentID:         1,
		ParameterID:           1,
		StandardID:            1,
		UnitID:                1,
		StatusID:              1,
		EmployeeID:            1,
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Date is required"))
}

// Data
func TestValidEnvironmentalRecordDataZero(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.EnvironmentalRecord{
		Date:                   time.Now(),
		Data:                   0, // เป็๋น 0
		Note:                   "zero is valid",
		BeforeAfterTreatmentID: 1,
		EnvironmentID:          1,
		ParameterID:            1,
		StandardID:             1,
		UnitID:                 1,
		StatusID:               1,
		EmployeeID:             1,
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidEnvironmentalRecordDataNegative(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.EnvironmentalRecord{
		Date:                   time.Now(),
		Data:                   -5, // ติดลบ
		Note:                   "negative value",
		BeforeAfterTreatmentID: 1,
		EnvironmentID:          1,
		ParameterID:            1,
		StandardID:             1,
		UnitID:                 1,
		StatusID:               1,
		EmployeeID:             1,
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Data must be >= 0"))
}

// Note
func TestValidEnvironmentalRecordWithoutNote(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.EnvironmentalRecord{
		Date:                   time.Now(),
		Data:                   7.5,
		Note:                   "", // ว่าง
		BeforeAfterTreatmentID: 1,
		EnvironmentID:          1,
		ParameterID:            1,
		StandardID:             1,
		UnitID:                 1,
		StatusID:               1,
		EmployeeID:             1,
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

// EmployeeID
func TestInvalidEnvironmentalRecordEmployeeID(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.EnvironmentalRecord{
		Date:                  time.Now(),
		Data:                  7.5,
		Note:                  "pH value normal",
		BeforeAfterTreatmentID: 1,
		EnvironmentID:         1,
		ParameterID:           1,
		StandardID:            1,
		UnitID:                1,
		StatusID:              1,
		EmployeeID:            0, // ไม่มี ID
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("EmployeeID is required"))
}

// BeforeAfterTreatmentID
func TestInvalidEnvironmentalRecordBeforeAfterTreatmentID(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.EnvironmentalRecord{
		Date:                  time.Now(),
		Data:                  7.5,
		Note:                  "pH value normal",
		BeforeAfterTreatmentID: 0, // ไม่มี ID
		EnvironmentID:         1,
		ParameterID:           1,
		StandardID:            1,
		UnitID:                1,
		StatusID:              1,
		EmployeeID:            1,
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("BeforeAfterTreatmentID is required"))
}

// EnvironmentID
func TestInvalidEnvironmentalRecordEnvironmentID(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.EnvironmentalRecord{
		Date:                  time.Now(),
		Data:                  7.5,
		Note:                  "pH value normal",
		BeforeAfterTreatmentID: 1,
		EnvironmentID:         0, // ไม่มี ID
		ParameterID:           1,
		StandardID:            1,
		UnitID:                1,
		StatusID:              1,
		EmployeeID:            1,
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("EnvironmentID is required"))
}

// ParameterID
func TestInvalidEnvironmentalRecordParameterID(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.EnvironmentalRecord{
		Date:                  time.Now(),
		Data:                  7.5,
		Note:                  "pH value normal",
		BeforeAfterTreatmentID: 1,
		EnvironmentID:         1,
		ParameterID:           0, // ไม่มี ID
		StandardID:            1,
		UnitID:                1,
		StatusID:              1,
		EmployeeID:            1,
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("ParameterID is required"))
}

// StandardID 
func TestInvalidEnvironmentalRecordStandardID(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.EnvironmentalRecord{
		Date:                  time.Now(),
		Data:                  7.5,
		Note:                  "pH value normal",
		BeforeAfterTreatmentID: 1,
		EnvironmentID:         1,
		ParameterID:           1,
		StandardID:            0, // ไม่มี ID
		UnitID:                1,
		StatusID:              1,
		EmployeeID:            1,
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("StandardID is required"))
}

// UnitID
func TestInvalidEnvironmentalRecordUnitID(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.EnvironmentalRecord{
		Date:                  time.Now(),
		Data:                  7.5,
		Note:                  "pH value normal",
		BeforeAfterTreatmentID: 1,
		EnvironmentID:         1,
		ParameterID:           1,
		StandardID:            1,
		UnitID:                0, // ไม่มี ID
		StatusID:              1,
		EmployeeID:            1,
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("UnitID is required"))
}

// StatusID
func TestInvalidEnvironmentalRecordStatusID(t *testing.T) {
	g := NewGomegaWithT(t)

	record := entity.EnvironmentalRecord{
		Date:                  time.Now(),
		Data:                  7.5,
		Note:                  "pH value normal",
		BeforeAfterTreatmentID: 1,
		EnvironmentID:         1,
		ParameterID:           1,
		StandardID:            1,
		UnitID:                1,
		StatusID:              0, // ไม่มี ID
		EmployeeID:            1,
	}

	ok, err := govalidator.ValidateStruct(record)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("StatusID is required"))
}
