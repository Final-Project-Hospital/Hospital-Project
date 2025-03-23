package entity


import "gorm.io/gorm"


type PH_Central struct {
   gorm.Model
   Before string 
   After string
}