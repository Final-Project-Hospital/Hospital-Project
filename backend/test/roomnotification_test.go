package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/Tawunchai/hospital-project/entity"
)

func TestValidRoomNotification(t *testing.T) {
	g := NewGomegaWithT(t)

	rn := entity.RoomNotification{
		RoomID:         1,
		NotificationID: 1,
	}

	ok, err := govalidator.ValidateStruct(rn)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidRoomNotificationRoomID(t *testing.T) {
	g := NewGomegaWithT(t)

	rn := entity.RoomNotification{
		RoomID:         0,
		NotificationID: 1,
	}

	ok, err := govalidator.ValidateStruct(rn)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("RoomID is required"))
}

func TestInvalidRoomNotificationNotificationID(t *testing.T) {
	g := NewGomegaWithT(t)

	rn := entity.RoomNotification{
		RoomID:         1,
		NotificationID: 0,
	}

	ok, err := govalidator.ValidateStruct(rn)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("NotificationID is required"))
}
