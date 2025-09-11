package unit

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/Tawunchai/hospital-project/entity"
)

func TestValidSensorDataParameter(t *testing.T) {
	g := NewGomegaWithT(t)

	sdp := entity.SensorDataParameter{
		Date:               time.Now(),
		Data:               45.6,
		Note:               "OK",
		SensorDataID:       1,
		HardwareParameterID: 2,
	}

	ok, err := govalidator.ValidateStruct(sdp)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidSensorDataParameter_DateMissing(t *testing.T) {
	g := NewGomegaWithT(t)

	sdp := entity.SensorDataParameter{
		Data:               12.3,
		SensorDataID:       1,
		HardwareParameterID: 2,
	}

	ok, err := govalidator.ValidateStruct(sdp)
	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("Date is required"))
}

func TestInvalidSensorDataParameter_DataMissing(t *testing.T) {
	g := NewGomegaWithT(t)

	sdp := entity.SensorDataParameter{
		Date:               time.Now(),
		SensorDataID:       1,
		HardwareParameterID: 2,
	}

	ok, err := govalidator.ValidateStruct(sdp)
	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("Data is required"))
}

func TestInvalidSensorDataParameter_SensorDataIDMissing(t *testing.T) {
	g := NewGomegaWithT(t)

	sdp := entity.SensorDataParameter{
		Date:               time.Now(),
		Data:               33.3,
		HardwareParameterID: 2,
	}

	ok, err := govalidator.ValidateStruct(sdp)
	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("SensorDataID is required"))
}

func TestInvalidSensorDataParameter_HardwareParameterIDMissing(t *testing.T) {
	g := NewGomegaWithT(t)

	sdp := entity.SensorDataParameter{
		Date:         time.Now(),
		Data:         33.3,
		SensorDataID: 1,
	}

	ok, err := govalidator.ValidateStruct(sdp)
	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("HardwareParameterID is required"))
}
