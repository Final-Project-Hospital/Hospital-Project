package unit
//
import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/Tawunchai/hospital-project/entity"
)

func TestValidEmployeeInput(t *testing.T) {
	g := NewGomegaWithT(t)

	emp := entity.Employee{
		FirstName:  "John",
		LastName:   "Doe",
		Email:      "john.doe@example.com",
		Phone:      "0812345678",
		Password:   "securepassword",
		Profile:    "Profile text",
		RoleID:     1,
		PositionID: 1,
	}

	ok, err := govalidator.ValidateStruct(emp)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

// --------- FirstName ---------
func TestInvalidEmployeeFirstName(t *testing.T) {
	g := NewGomegaWithT(t)

	emp := entity.Employee{
		FirstName:  "",
		LastName:   "Doe",
		Email:      "john.doe@example.com",
		Phone:      "0812345678",
		Password:   "securepassword",
		Profile:    "Profile text",
		RoleID:     1,
		PositionID: 1,
	}

	ok, err := govalidator.ValidateStruct(emp)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("FirstName is required"))
}

// --------- LastName ---------
func TestInvalidEmployeeLastName(t *testing.T) {
	g := NewGomegaWithT(t)

	emp := entity.Employee{
		FirstName:  "John",
		LastName:   "",
		Email:      "john.doe@example.com",
		Phone:      "0812345678",
		Password:   "securepassword",
		Profile:    "Profile text",
		RoleID:     1,
		PositionID: 1,
	}

	ok, err := govalidator.ValidateStruct(emp)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("LastName is required"))
}

// --------- Email ---------
func TestInvalidEmployeeEmailRequired(t *testing.T) {
	g := NewGomegaWithT(t)

	emp := entity.Employee{
		FirstName:  "John",
		LastName:   "Doe",
		Email:      "",
		Phone:      "0812345678",
		Password:   "securepassword",
		Profile:    "Profile text",
		RoleID:     1,
		PositionID: 1,
	}

	ok, err := govalidator.ValidateStruct(emp)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Email is required"))
}

func TestInvalidEmployeeEmailFormat(t *testing.T) {
	g := NewGomegaWithT(t)

	emp := entity.Employee{
		FirstName:  "John",
		LastName:   "Doe",
		Email:      "not-an-email",
		Phone:      "0812345678",
		Password:   "securepassword",
		Profile:    "Profile text",
		RoleID:     1,
		PositionID: 1,
	}

	ok, err := govalidator.ValidateStruct(emp)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Email must be valid"))
}

// --------- Phone ---------
func TestInvalidEmployeePhoneRequired(t *testing.T) {
	g := NewGomegaWithT(t)

	emp := entity.Employee{
		FirstName:  "John",
		LastName:   "Doe",
		Email:      "john.doe@example.com",
		Phone:      "",
		Password:   "securepassword",
		Profile:    "Profile text",
		RoleID:     1,
		PositionID: 1,
	}

	ok, err := govalidator.ValidateStruct(emp)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Phone is required"))
}

func TestInvalidEmployeePhoneFormat(t *testing.T) {
	g := NewGomegaWithT(t)

	emp := entity.Employee{
		FirstName:  "John",
		LastName:   "Doe",
		Email:      "john.doe@example.com",
		Phone:      "1234567890", // ❌ ไม่ขึ้นต้นด้วย 0
		Password:   "securepassword",
		Profile:    "Profile text",
		RoleID:     1,
		PositionID: 1,
	}

	ok, err := govalidator.ValidateStruct(emp)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Phone must be 10 digits and start with 0"))
}

// --------- Password ---------
func TestInvalidEmployeePassword(t *testing.T) {
	g := NewGomegaWithT(t)

	emp := entity.Employee{
		FirstName:  "John",
		LastName:   "Doe",
		Email:      "john.doe@example.com",
		Phone:      "0812345678",
		Password:   "",
		Profile:    "Profile text",
		RoleID:     1,
		PositionID: 1,
	}

	ok, err := govalidator.ValidateStruct(emp)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Password is required"))
}

// --------- Profile ---------
func TestInvalidEmployeeProfile(t *testing.T) {
	g := NewGomegaWithT(t)

	emp := entity.Employee{
		FirstName:  "John",
		LastName:   "Doe",
		Email:      "john.doe@example.com",
		Phone:      "0812345678",
		Password:   "securepassword",
		Profile:    "",
		RoleID:     1,
		PositionID: 1,
	}

	ok, err := govalidator.ValidateStruct(emp)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Profile is required"))
}

// --------- RoleID ---------
func TestInvalidEmployeeRoleID(t *testing.T) {
	g := NewGomegaWithT(t)

	emp := entity.Employee{
		FirstName:  "John",
		LastName:   "Doe",
		Email:      "john.doe@example.com",
		Phone:      "0812345678",
		Password:   "securepassword",
		Profile:    "Profile text",
		RoleID:     0, // ❌ missing
		PositionID: 1,
	}

	ok, err := govalidator.ValidateStruct(emp)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("RoleID is required"))
}

// --------- PositionID ---------
func TestInvalidEmployeePositionID(t *testing.T) {
	g := NewGomegaWithT(t)

	emp := entity.Employee{
		FirstName:  "John",
		LastName:   "Doe",
		Email:      "john.doe@example.com",
		Phone:      "0812345678",
		Password:   "securepassword",
		Profile:    "Profile text",
		RoleID:     1,
		PositionID: 0, // ❌ missing
	}

	ok, err := govalidator.ValidateStruct(emp)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("PositionID is required"))
}
