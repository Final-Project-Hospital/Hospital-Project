package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/Tawunchai/hospital-project/entity"
)

func TestValidUnit(t *testing.T) {
	g := NewGomegaWithT(t)

	unit := entity.Unit{
		UnitName: "mg/L",
	}

	ok, err := govalidator.ValidateStruct(unit)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidUnit(t *testing.T) {
	g := NewGomegaWithT(t)

	unit := entity.Unit{
		UnitName: "",
	}

	ok, err := govalidator.ValidateStruct(unit)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("UnitName is required"))
}
