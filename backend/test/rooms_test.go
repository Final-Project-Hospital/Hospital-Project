package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/Tawunchai/hospital-project/entity"
)

func TestValidRoom(t *testing.T) {
	g := NewGomegaWithT(t)

	room := entity.Room{
		RoomName:   "Lab 101",
		Floor:      3,
		Icon:       "FaMicroscope",
		BuildingID: 1,
		EmployeeID: 1,
		HardwareID: 1,
	}

	ok, err := govalidator.ValidateStruct(room)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidRoomName(t *testing.T) {
	g := NewGomegaWithT(t)

	room := entity.Room{
		RoomName:   "",
		Floor:      2,
		Icon:       "FaMicroscope",
		BuildingID: 1,
		EmployeeID: 1,
		HardwareID: 1,
	}

	ok, err := govalidator.ValidateStruct(room)
	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("RoomName is required"))
}

func TestInvalidRoomFloor(t *testing.T) {
	g := NewGomegaWithT(t)

	room := entity.Room{
		RoomName:   "Lab 102",
		Floor:      0, // ❌ required
		Icon:       "FaMicroscope",
		BuildingID: 1,
		EmployeeID: 1,
		HardwareID: 1,
	}

	ok, err := govalidator.ValidateStruct(room)
	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("Floor is required"))
}

func TestInvalidRoomIcon(t *testing.T) {
	g := NewGomegaWithT(t)

	room := entity.Room{
		RoomName:   "Lab 103",
		Floor:      1,
		Icon:       "",
		BuildingID: 1,
		EmployeeID: 1,
		HardwareID: 1,
	}

	ok, err := govalidator.ValidateStruct(room)
	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("Icon is required"))
}
