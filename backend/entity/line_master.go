package entity

import (
	"gorm.io/gorm"
)

type LineMaster struct {
	gorm.Model
	Token string
}
