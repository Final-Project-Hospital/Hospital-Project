package entity

import (
	
	"gorm.io/gorm"
)

type UserRoles struct {
	gorm.Model
	RoleName string
	
	Users []User `gorm:"foreignKey:UserRoleID"`
}