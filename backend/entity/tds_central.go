package entity


import "gorm.io/gorm"


type TDS_Central struct {
   gorm.Model
   Before string 
   After string
}