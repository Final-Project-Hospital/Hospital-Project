package unit

import (
	"testing"

	"github.com/Tawunchai/hospital-project/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestValidBeforeAfterTreatment(t *testing.T) {
	g := NewGomegaWithT(t)

	env := entity.BeforeAfterTreatment{
		TreatmentName: "ก่อน",
	}

	ok, err := govalidator.ValidateStruct(env)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidBeforeAfterTreatment(t *testing.T) {
	g := NewGomegaWithT(t)

	env := entity.BeforeAfterTreatment{
		TreatmentName: "",
	}

	ok, err := govalidator.ValidateStruct(env)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("TreatmentName is required"))
}
