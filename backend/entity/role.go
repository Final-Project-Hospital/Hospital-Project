package entity

import (
	"gorm.io/gorm"
)

type Role struct {
	gorm.Model
	RoleName string `valid:"required~RoleName is required"`

	Employee []Employee `gorm:"foreignKey:RoleID" valid:"-"`
}
