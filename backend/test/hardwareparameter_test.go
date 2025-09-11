package unit
//
import (
	"strings"
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/Tawunchai/hospital-project/entity"
)

func TestValidHardwareParameter(t *testing.T) {
	g := NewGomegaWithT(t)

	hp := entity.HardwareParameter{
		Parameter:                "Temperature",
		Icon:                     "FaTemperatureHigh",
		Index:                    1,
		Right:                    true,
		GroupDisplay:             false,
		LayoutDisplay:            false,
		Alert:                    true,
		StandardHardwareID:       1,
		UnitHardwareID:           1,
		HardwareGraphID:          1,
		HardwareParameterColorID: 1,
		EmployeeID:               1,
	}

	ok, err := govalidator.ValidateStruct(hp)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidHardwareParameter_EmptyParameter(t *testing.T) {
	g := NewGomegaWithT(t)

	hp := entity.HardwareParameter{
		Parameter:                "",
		Icon:                     "FaTemperatureHigh",
		Index:                    1,
		StandardHardwareID:       1,
		UnitHardwareID:           1,
		HardwareGraphID:          1,
		HardwareParameterColorID: 1,
		EmployeeID:               1,
	}

	ok, err := govalidator.ValidateStruct(hp)
	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("Parameter is required"))
}

func TestInvalidHardwareParameter_EmptyIcon(t *testing.T) {
	g := NewGomegaWithT(t)

	hp := entity.HardwareParameter{
		Parameter:                "Humidity",
		Icon:                     "",
		Index:                    1,
		StandardHardwareID:       1,
		UnitHardwareID:           1,
		HardwareGraphID:          1,
		HardwareParameterColorID: 1,
		EmployeeID:               1,
	}

	ok, err := govalidator.ValidateStruct(hp)
	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("Icon is required"))
}

func TestInvalidHardwareParameter_MissingIndex(t *testing.T) {
	g := NewGomegaWithT(t)

	hp := entity.HardwareParameter{
		Parameter:                "Voltage",
		Icon:                     "FaBolt",
		Index:                    0, // ❌ required
		StandardHardwareID:       1,
		UnitHardwareID:           1,
		HardwareGraphID:          1,
		HardwareParameterColorID: 1,
		EmployeeID:               1,
	}

	ok, err := govalidator.ValidateStruct(hp)
	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("Index is required"))
}

func TestInvalidHardwareParameter_MissingFKs(t *testing.T) {
	g := NewGomegaWithT(t)

	hp := entity.HardwareParameter{
		Parameter: "Oxygen",
		Icon:      "FaLungs",
		Index:     1,
		// ❌ foreign keys missing
		StandardHardwareID:       0,
		UnitHardwareID:           0,
		HardwareGraphID:          0,
		HardwareParameterColorID: 0,
		EmployeeID:               0,
	}

	ok, err := govalidator.ValidateStruct(hp)
	g.Expect(ok).To(BeFalse())

	// ✅ แยก error message ด้วย ";"
	errs := strings.Split(err.Error(), ";")

	// ✅ ตรวจว่ามีครบทุก error ที่ต้องการ
	g.Expect(errs).To(ContainElements(
		"StandardHardwareID is required",
		"UnitHardwareID is required",
		"HardwareGraphID is required",
		"HardwareParameterColorID is required",
		"EmployeeID is required",
	))
}
