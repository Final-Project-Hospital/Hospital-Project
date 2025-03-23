package entity


import "gorm.io/gorm"


type TS_Central struct {
   gorm.Model
   Before string 
   After string
}