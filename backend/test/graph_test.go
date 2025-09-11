package unit
//
import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/Tawunchai/hospital-project/entity"
)

func TestValidHardwareGraph(t *testing.T) {
	g := NewGomegaWithT(t)

	hg := entity.HardwareGraph{
		Graph: "LineChart",
	}

	ok, err := govalidator.ValidateStruct(hg)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidHardwareGraph(t *testing.T) {
	g := NewGomegaWithT(t)

	hg := entity.HardwareGraph{
		Graph: "",
	}

	ok, err := govalidator.ValidateStruct(hg)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Graph is required"))
}
