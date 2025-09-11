// file: calendar_test.go
package unit

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/Tawunchai/hospital-project/entity"
)

// helper สร้างสตริงยาว n ตัวอักษร
func makeString(n int) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = 'A'
	}
	return string(b)
}

func TestValidCalendarInput(t *testing.T) {
	g := NewGomegaWithT(t)

	employeeID := uint(1)
	start := time.Now()
	end := start.Add(2 * time.Hour)

	cal := entity.Calendar{
		Title:       "Team Meeting",
		Location:    "Meeting Room 1",
		Description: "Weekly sync",
		StartDate:   start,
		EndDate:     end,
		EmployeeID:  &employeeID,
	}

	ok, err := govalidator.ValidateStruct(cal)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidCalendarTitle_Missing(t *testing.T) {
	g := NewGomegaWithT(t)

	employeeID := uint(1)
	start := time.Now()
	end := start.Add(time.Hour)

	cal := entity.Calendar{
		Title:       "", // ❌
		Location:    "Room 2",
		Description: "Planning",
		StartDate:   start,
		EndDate:     end,
		EmployeeID:  &employeeID,
	}

	ok, err := govalidator.ValidateStruct(cal)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Title is required"))
}

func TestInvalidCalendarTitle_Exceeds100Chars(t *testing.T) {
	g := NewGomegaWithT(t)

	employeeID := uint(1)
	start := time.Now()
	end := start.Add(time.Hour)

	longTitle := makeString(101) // > 100
	cal := entity.Calendar{
		Title:       longTitle, // ❌
		Location:    "Room 3",
		Description: "Deep dive",
		StartDate:   start,
		EndDate:     end,
		EmployeeID:  &employeeID,
	}

	ok, err := govalidator.ValidateStruct(cal)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Title must be between 1 and 100 characters"))
}

func TestValidCalendarTitle_LengthBoundary100(t *testing.T) {
	g := NewGomegaWithT(t)

	employeeID := uint(1)
	start := time.Now()
	end := start.Add(time.Hour)

	title100 := makeString(100) // exactly 100
	cal := entity.Calendar{
		Title:       title100,
		Location:    "Auditorium",
		Description: "Town hall",
		StartDate:   start,
		EndDate:     end,
		EmployeeID:  &employeeID,
	}

	ok, err := govalidator.ValidateStruct(cal)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidCalendarLocation_Missing(t *testing.T) {
	g := NewGomegaWithT(t)

	employeeID := uint(1)
	start := time.Now()
	end := start.Add(time.Hour)

	cal := entity.Calendar{
		Title:       "No Location",
		Location:    "", // ❌
		Description: "Desc",
		StartDate:   start,
		EndDate:     end,
		EmployeeID:  &employeeID,
	}

	ok, err := govalidator.ValidateStruct(cal)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Location is required"))
}

func TestInvalidCalendarDescription_Missing(t *testing.T) {
	g := NewGomegaWithT(t)

	employeeID := uint(1)
	start := time.Now()
	end := start.Add(time.Hour)

	cal := entity.Calendar{
		Title:       "No Description",
		Location:    "Room 4",
		Description: "", // ❌
		StartDate:   start,
		EndDate:     end,
		EmployeeID:  &employeeID,
	}

	ok, err := govalidator.ValidateStruct(cal)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Description is required"))
}

func TestInvalidCalendarStartDate_Missing(t *testing.T) {
	g := NewGomegaWithT(t)

	employeeID := uint(1)
	// ใช้ zero value ของ time.Time เพื่อให้ 'required' fail
	var zero time.Time
	end := time.Now().Add(time.Hour)

	cal := entity.Calendar{
		Title:       "Missing StartDate",
		Location:    "Room 5",
		Description: "Desc",
		StartDate:   zero, // ❌
		EndDate:     end,
		EmployeeID:  &employeeID,
	}

	ok, err := govalidator.ValidateStruct(cal)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Start date is required"))
}

func TestInvalidCalendarEndDate_Missing(t *testing.T) {
	g := NewGomegaWithT(t)

	employeeID := uint(1)
	start := time.Now()
	var zero time.Time // zero end

	cal := entity.Calendar{
		Title:       "Missing EndDate",
		Location:    "Room 6",
		Description: "Desc",
		StartDate:   start,
		EndDate:     zero, // ❌
		EmployeeID:  &employeeID,
	}

	ok, err := govalidator.ValidateStruct(cal)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("End date is required"))
}

func TestInvalidCalendarEmployeeID_Missing(t *testing.T) {
	g := NewGomegaWithT(t)

	start := time.Now()
	end := start.Add(time.Hour)

	cal := entity.Calendar{
		Title:       "No Employee",
		Location:    "Room 7",
		Description: "Desc",
		StartDate:   start,
		EndDate:     end,
		EmployeeID:  nil, // ❌
	}

	ok, err := govalidator.ValidateStruct(cal)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("EmployeeID is required"))
}
