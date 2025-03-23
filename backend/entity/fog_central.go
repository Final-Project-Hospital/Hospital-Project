package entity


import "gorm.io/gorm"


type FOG_Central struct {
   gorm.Model
   Before string 
   After string
}