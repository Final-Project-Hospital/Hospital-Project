package entity


import (
   "time"
   "gorm.io/gorm"
)

type Users struct {
   gorm.Model

   FirstName string    
   LastName  string    
   Email     string    
   Age       uint8
   Username string 
   Password  string    
   BirthDay  time.Time 
   GenderID  uint      

   Gender    Genders  `gorm:"foreignKey:GenderID"`
}