package unit
//
import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/Tawunchai/hospital-project/entity"
)

func TestValidUnitHardware(t *testing.T) {
	g := NewGomegaWithT(t)

	uh := entity.UnitHardware{
		Unit: "ppm",
	}

	ok, err := govalidator.ValidateStruct(uh)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidUnitHardware(t *testing.T) {
	g := NewGomegaWithT(t)

	uh := entity.UnitHardware{
		Unit: "",
	}

	ok, err := govalidator.ValidateStruct(uh)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Unit is required"))
}
