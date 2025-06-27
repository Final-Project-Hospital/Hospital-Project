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
	Profile     string 
		
	RoleID	uint
	Role	*Role `gorm:"foreignKey: RoleID"`

    PositionID	uint
	Position	*Position `gorm:"foreignKey: PositionID"`

	Room []Room `gorm:"foreignKey: EmployeeID"`

	EnvironmentalRecord []EnvironmentalRecord `gorm:"foreignKey: EmployeeID"`
}