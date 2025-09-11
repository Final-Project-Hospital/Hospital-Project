package unit
//
import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/Tawunchai/hospital-project/entity"
)

func TestValidPosition(t *testing.T) {
	g := NewGomegaWithT(t)

	pos := entity.Position{
		Position: "Manager",
	}

	ok, err := govalidator.ValidateStruct(pos)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidPosition(t *testing.T) {
	g := NewGomegaWithT(t)

	pos := entity.Position{
		Position: "",
	}

	ok, err := govalidator.ValidateStruct(pos)
	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("Position is required"))
}
