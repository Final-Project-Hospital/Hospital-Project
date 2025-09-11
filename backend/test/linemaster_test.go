package unit
//
import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/Tawunchai/hospital-project/entity"
)

func TestValidLineMaster(t *testing.T) {
	g := NewGomegaWithT(t)
	employeeID := uint(1)

	line := entity.LineMaster{
		Token:      "sample-token",
		EmployeeID: &employeeID,
	}

	ok, err := govalidator.ValidateStruct(line)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidLineMasterToken(t *testing.T) {
	g := NewGomegaWithT(t)
	employeeID := uint(1)

	line := entity.LineMaster{
		Token:      "",
		EmployeeID: &employeeID,
	}

	ok, err := govalidator.ValidateStruct(line)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Token is required"))
}

func TestInvalidLineMasterEmployeeID(t *testing.T) {
	g := NewGomegaWithT(t)

	line := entity.LineMaster{
		Token:      "sample-token",
		EmployeeID: nil,
	}

	ok, err := govalidator.ValidateStruct(line)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("EmployeeID is required"))
}
