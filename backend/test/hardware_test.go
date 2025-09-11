package unit
//
import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/Tawunchai/hospital-project/entity"
)

func TestValidHardware(t *testing.T) {
	g := NewGomegaWithT(t)

	hw := entity.Hardware{
		Name:       "Sensor Box",
		MacAddress: "00:1A:2B:3C:4D:5E",
	}

	ok, err := govalidator.ValidateStruct(hw)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidHardwareName(t *testing.T) {
	g := NewGomegaWithT(t)

	hw := entity.Hardware{
		Name:       "",
		MacAddress: "00:1A:2B:3C:4D:5E",
	}

	ok, err := govalidator.ValidateStruct(hw)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Name is required"))
}

func TestInvalidHardwareMacAddress(t *testing.T) {
	g := NewGomegaWithT(t)

	hw := entity.Hardware{
		Name:       "Sensor Box",
		MacAddress: "",
	}

	ok, err := govalidator.ValidateStruct(hw)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("MacAddress is required"))
}
