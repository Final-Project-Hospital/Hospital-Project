package unit

import (
	"testing"

	"github.com/Tawunchai/hospital-project/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestValidEnvironment(t *testing.T) {
	g := NewGomegaWithT(t)

	env := entity.Environment{
		EnvironmentName: "น้ำเสีย",
	}

	ok, err := govalidator.ValidateStruct(env)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidEnvironment(t *testing.T) {
	g := NewGomegaWithT(t)

	env := entity.Environment{
		EnvironmentName: "",
	}

	ok, err := govalidator.ValidateStruct(env)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("EnvironmentName is required"))
}
