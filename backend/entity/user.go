package entity

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username    string 
    Password    string 
    Email 	    string 
    FirstName   string 
    LastName    string   
	Profile     string    
	PhoneNumber string 
		
	UserRoleID	uint
	UserRole	*UserRoles `gorm:"foreignKey: UserRoleID"`

    PositionID	uint
	Position	*Position `gorm:"foreignKey: PositionID"`

	Room []Room `gorm:"foreignKey: UserID"`

	EnvironmentalRecord []EnvironmentalRecord `gorm:"foreignKey: UserID"`
}