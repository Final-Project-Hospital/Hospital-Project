package unit
//
import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/Tawunchai/hospital-project/entity"
)

func TestValidNotification(t *testing.T) {
	g := NewGomegaWithT(t)

	noti := entity.Notification{
		Name:   "Fire Alarm",
		UserID: "user123",
		Alert:  true,
	}

	ok, err := govalidator.ValidateStruct(noti)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestInvalidNotificationName(t *testing.T) {
	g := NewGomegaWithT(t)

	noti := entity.Notification{
		Name:   "",
		UserID: "user123",
		Alert:  true,
	}

	ok, err := govalidator.ValidateStruct(noti)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Name is required"))
}

func TestInvalidNotificationUserID(t *testing.T) {
	g := NewGomegaWithT(t)

	noti := entity.Notification{
		Name:   "Fire Alarm",
		UserID: "",
		Alert:  true,
	}

	ok, err := govalidator.ValidateStruct(noti)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("UserID is required"))
}
