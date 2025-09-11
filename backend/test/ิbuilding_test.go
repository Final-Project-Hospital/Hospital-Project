package unit
//
import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/Tawunchai/hospital-project/entity"
)

func TestValidBuildingInput(t *testing.T) {
	g := NewGomegaWithT(t)
	employeeID := uint(1)

	building := entity.Building{
		BuildingName: "Main Building",
		EmployeeID:   &employeeID,
	}

	ok, err := govalidator.ValidateStruct(building)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidBuildingName(t *testing.T) {
	g := NewGomegaWithT(t)
	employeeID := uint(1)

	building := entity.Building{
		BuildingName: "",
		EmployeeID:   &employeeID,
	}

	ok, err := govalidator.ValidateStruct(building)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("BuildingName is required"))
}

func TestInvalidBuildingEmployeeID(t *testing.T) {
	g := NewGomegaWithT(t)

	building := entity.Building{
		BuildingName: "Main Building",
		EmployeeID:   nil,
	}

	ok, err := govalidator.ValidateStruct(building)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("EmployeeID is required"))
}
