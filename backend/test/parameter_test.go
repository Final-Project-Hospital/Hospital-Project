package unit

import (
	"testing"

	"github.com/Tawunchai/hospital-project/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestValidParameter(t *testing.T) {
	g := NewGomegaWithT(t)

	env := entity.Parameter{
		ParameterName: "Potential of Hydrogen",
	}

	ok, err := govalidator.ValidateStruct(env)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidParameter(t *testing.T) {
	g := NewGomegaWithT(t)

	env := entity.Parameter{
		ParameterName: "",
	}

	ok, err := govalidator.ValidateStruct(env)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("ParameterName is required"))
}
