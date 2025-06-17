package config

import (
	"fmt"

	"github.com/Tawunchai/hospital-project/entity"

	"gorm.io/driver/sqlite"

	"gorm.io/gorm"
)

var db *gorm.DB

func DB() *gorm.DB {

	return db

}

func ConnectionDB() {

	database, err := gorm.Open(sqlite.Open("hospital.db?cache=shared"), &gorm.Config{})

	if err != nil {

		panic("failed to connect database")

	}

	fmt.Println("connected database")

	db = database

}

func SetupDatabase() {

	db.AutoMigrate(

		&entity.User{},
		&entity.UserRoles{},
        &entity.Position{},
	)

	AdminRole := entity.UserRoles{RoleName: "Admin"}
	UserRole := entity.UserRoles{RoleName: "User"}

	db.FirstOrCreate(&AdminRole, &entity.UserRoles{RoleName: "Admin"})
	db.FirstOrCreate(&UserRole, &entity.UserRoles{RoleName: "User"})

    Position1 := entity.Position{Position: "Engineer"}
	Position2 := entity.Position{Position: "Doctor"}
    Position3 := entity.Position{Position: "unknown"}

	db.FirstOrCreate(&Position1, &entity.Position{Position: "Engineer"})
	db.FirstOrCreate(&Position2, &entity.Position{Position: "Doctor"})
    db.FirstOrCreate(&Position3, &entity.Position{Position: "unknown"})


	User1 := entity.User{
		Username:   "user1",
		FirstName:  "Janis",
		LastName:   "Green",
		Email:      "janis.green@example.com",
		Password:   "123",
		Profile:    "uploads/profile/profile6.jpg",
        PhoneNumber: "0945096372",
        PositionID: 3,
		UserRoleID: 2,
	}
	db.FirstOrCreate(&User1, entity.User{Username: "user1"})

	User2 := entity.User{
		Username:   "user2",
		FirstName:  "Chris",
		LastName:   "Taylor",
		Email:      "chris.taylor@example.com",
		Password:   "123",
		Profile:    "uploads/profile/profile5.jpeg",
        PhoneNumber: "0945096372",
        PositionID: 3,
		UserRoleID: 2,
	}
	db.FirstOrCreate(&User2, entity.User{Username: "user2"})

	User3 := entity.User{
		Username:   "user3",
		FirstName:  "Alex",
		LastName:   "Smith",
		Email:      "alex.smith@example.com",
		Password:   "123",
		Profile:    "uploads/profile/profile4.jpeg",
        PhoneNumber: "0945096372",
        PositionID: 3,
		UserRoleID: 2,
	}
	db.FirstOrCreate(&User3, entity.User{Username: "user3"})

	Admin := entity.User{
		Username:   "admin",
		FirstName:  "Kanyapron",
		LastName:   "KD",
		Email:      "Kanyapron@gmail.com",
		Password:   "123",
		Profile:    "uploads/profile/profile1.jpg",
        PhoneNumber: "0945096372",
        PositionID: 1,
		UserRoleID: 1,
	}
	db.FirstOrCreate(&Admin, entity.User{Username: "admin"})

}
