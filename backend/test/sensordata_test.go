package unit

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/Tawunchai/hospital-project/entity"
)

func TestValidSensorData(t *testing.T) {
	g := NewGomegaWithT(t)

	sd := entity.SensorData{
		Date:       time.Now(),
		HardwareID: 1,
	}

	ok, err := govalidator.ValidateStruct(sd)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidSensorDataDate(t *testing.T) {
	g := NewGomegaWithT(t)

	sd := entity.SensorData{
		Date:       time.Time{}, // zero value
		HardwareID: 1,
	}

	ok, err := govalidator.ValidateStruct(sd)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Date is required"))
}

func TestInvalidSensorDataHardwareID(t *testing.T) {
	g := NewGomegaWithT(t)

	sd := entity.SensorData{
		Date:       time.Now(),
		HardwareID: 0, // missing
	}

	ok, err := govalidator.ValidateStruct(sd)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("HardwareID is required"))
}
