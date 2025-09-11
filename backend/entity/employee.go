package entity

import (
	"gorm.io/gorm"
)

type Employee struct {
	gorm.Model
	FirstName string `valid:"required~FirstName is required"`
	LastName  string `valid:"required~LastName is required"`
	Email     string `valid:"required~Email is required,email~Email must be valid"`
	Phone     string `valid:"required~Phone is required,matches(^0[0-9]{9}$)~Phone must be 10 digits and start with 0"`
	Password  string `valid:"required~Password is required"`
	Profile   string `gorm:"type:text" valid:"required~Profile is required"`

	RoleID uint  `valid:"required~RoleID is required"`
	Role   *Role `gorm:"foreignKey:RoleID" valid:"-"`

	PositionID uint      `valid:"required~PositionID is required"`
	Position   *Position `gorm:"foreignKey:PositionID" valid:"-"`

	Building             []Building             `gorm:"foreignKey:EmployeeID" valid:"-"`
	LineMaster           []LineMaster           `gorm:"foreignKey:EmployeeID" valid:"-"`
	Room                 []Room                 `gorm:"foreignKey:EmployeeID" valid:"-"`
	Calendar             []Calendar             `gorm:"foreignKey:EmployeeID" valid:"-"`
	EnvironmentalRecord  []EnvironmentalRecord  `gorm:"foreignKey:EmployeeID" valid:"-"`
	HardwareParameter    []HardwareParameter    `gorm:"foreignKey:EmployeeID" valid:"-"`
}
