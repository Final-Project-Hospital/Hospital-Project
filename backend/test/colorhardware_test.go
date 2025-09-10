package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/Tawunchai/hospital-project/entity"
)

func TestValidHardwareParameterColor(t *testing.T) {
	g := NewGomegaWithT(t)

	hpc := entity.HardwareParameterColor{
		Code: "#1A2B3C",
	}

	ok, err := govalidator.ValidateStruct(hpc)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidHardwareParameterColor_Empty(t *testing.T) {
	g := NewGomegaWithT(t)

	hpc := entity.HardwareParameterColor{
		Code: "",
	}

	ok, err := govalidator.ValidateStruct(hpc)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Code is required"))
}
