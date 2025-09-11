package entity

import (
	"gorm.io/gorm"
)

type Employee struct {
	gorm.Model
	FirstName   string
	LastName    string 
    Email 	    string       
	Phone		string
	Password    string
	Profile string `gorm:"type:text"`
		
	RoleID	uint
	Role	*Role `gorm:"foreignKey: RoleID"`

    PositionID	uint
	Position	*Position `gorm:"foreignKey: PositionID"`

	Room []Room `gorm:"foreignKey: EmployeeID"`

	Calendar []Calendar `gorm:"foreignKey: EmployeeID"`

	EnvironmentalRecord []EnvironmentalRecord `gorm:"foreignKey: EmployeeID"`

	HardwareParameter []HardwareParameter `gorm:"foreignKey: EmployeeID"`
}