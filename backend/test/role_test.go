package unit
//
import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/Tawunchai/hospital-project/entity"
)

func TestValidRole(t *testing.T) {
	g := NewGomegaWithT(t)

	role := entity.Role{
		RoleName: "Admin",
	}

	ok, err := govalidator.ValidateStruct(role)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidRole(t *testing.T) {
	g := NewGomegaWithT(t)

	role := entity.Role{
		RoleName: "",
	}

	ok, err := govalidator.ValidateStruct(role)
	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("RoleName is required"))
}