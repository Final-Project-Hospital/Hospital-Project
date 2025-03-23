package entity


import "gorm.io/gorm"


type TKN_Central struct {
   gorm.Model
   Before string 
   After string
}