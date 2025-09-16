package unit

import (
	"testing"

	"github.com/Tawunchai/hospital-project/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestValidStatus(t *testing.T) {
	g := NewGomegaWithT(t)

	env := entity.Status{
		StatusName: "ผ่านเกณฑ์มาตรฐาน",
	}

	ok, err := govalidator.ValidateStruct(env)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidStatus(t *testing.T) {
	g := NewGomegaWithT(t)

	env := entity.Status{
		StatusName: "",
	}

	ok, err := govalidator.ValidateStruct(env)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("StatusName is required"))
}
