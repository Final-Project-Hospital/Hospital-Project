package entity


import "gorm.io/gorm"


type DOB_Central struct {
   gorm.Model
   Before string 
   After string
}