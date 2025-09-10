package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/Tawunchai/hospital-project/entity"
)

func TestValidStandardHardware(t *testing.T) {
	g := NewGomegaWithT(t)

	std := entity.StandardHardware{
		MaxValueStandard: 100.5,
		MinValueStandard: 50,
	}

	ok, err := govalidator.ValidateStruct(std)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidStandardHardware_MaxValueMissing(t *testing.T) {
	g := NewGomegaWithT(t)

	std := entity.StandardHardware{
		MaxValueStandard: 0, // ❌ required
		MinValueStandard: 50,
	}

	ok, err := govalidator.ValidateStruct(std)
	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("MaxValueStandard is required"))
}

func TestInvalidStandardHardware_MinValueMissing(t *testing.T) {
	g := NewGomegaWithT(t)

	std := entity.StandardHardware{
		MaxValueStandard: 100,
		MinValueStandard: 0, // ❌ required
	}

	ok, err := govalidator.ValidateStruct(std)
	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("MinValueStandard is required"))
}
