package config

import (
	"fmt"

	"github.com/Tawunchai/hospital-project/entity"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var db *gorm.DB

func DB() *gorm.DB {
	return db
}

func ConnectionDB() {
	dsn := "host=localhost user=postgres password=1234 dbname=hospital port=5432 sslmode=disable TimeZone=Asia/Bangkok"

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("failed to connect to PostgreSQL database")
	}

	fmt.Println("connected to PostgreSQL database")
	db = database
}

func SetupDatabase() {
	db.AutoMigrate(
		&entity.Employee{},
		&entity.Role{},
		&entity.Position{},

		&entity.BeforeAfterTreatment{},
		&entity.Building{},
		&entity.Environment{},
		&entity.EnvironmentalRecord{},
		&entity.Hardware{},
		&entity.Parameter{},
		&entity.Room{},
		&entity.SensorDataParameter{},
		&entity.SensorData{},
		&entity.Standard{},
		&entity.Unit{},
	)

	

	// Roles
	AdminRole := entity.Role{RoleName: "Admin"}
	UserRole := entity.Role{RoleName: "User"}

	db.FirstOrCreate(&AdminRole, &entity.Role{RoleName: "Admin"})
	db.FirstOrCreate(&UserRole, &entity.Role{RoleName: "User"})

	// Positions
	Position1 := entity.Position{Position: "Engineer"}
	Position2 := entity.Position{Position: "Doctor"}
	Position3 := entity.Position{Position: "unknown"}

	db.FirstOrCreate(&Position1, &entity.Position{Position: "Engineer"})
	db.FirstOrCreate(&Position2, &entity.Position{Position: "Doctor"})
	db.FirstOrCreate(&Position3, &entity.Position{Position: "unknown"})

	// Building
	Building1 := entity.Building{BuildingName: "Building1"}
	Building2 := entity.Building{BuildingName: "Building2"}
	Building3 := entity.Building{BuildingName: "Building3"}

	db.FirstOrCreate(&Building1, &entity.Building{BuildingName: "Building1"})
	db.FirstOrCreate(&Building2, &entity.Building{BuildingName: "Building2"})
	db.FirstOrCreate(&Building3, &entity.Building{BuildingName: "Building3"})

	// Employees
	User1 := entity.Employee{
		FirstName:  "Janis",
		LastName:   "Green",
		Email:      "janis.green@example.com",
		Password:   "123",
		Profile:    "uploads/profile/profile6.jpg",
		Phone:      "0945096372",
		PositionID: 3,
		RoleID:     2,
	}
	db.FirstOrCreate(&User1, entity.Employee{Email: "janis.green@example.com"})

	User2 := entity.Employee{
		FirstName:  "Chris",
		LastName:   "Taylor",
		Email:      "chris.taylor@example.com",
		Password:   "123",
		Profile:    "uploads/profile/profile5.jpeg",
		Phone:      "0945096372",
		PositionID: 3,
		RoleID:     2,
	}
	db.FirstOrCreate(&User2, entity.Employee{Email: "chris.taylor@example.com"})

	User3 := entity.Employee{
		FirstName:  "Alex",
		LastName:   "Smith",
		Email:      "alex.smith@example.com",
		Password:   "123",
		Profile:    "uploads/profile/profile4.jpeg",
		Phone:      "0945096372",
		PositionID: 3,
		RoleID:     2,
	}
	db.FirstOrCreate(&User3, entity.Employee{Email: "alex.smith@example.com"})

	Admin := entity.Employee{
		FirstName:  "Kanyapron",
		LastName:   "KD",
		Email:      "admin@gmail.com",
		Password:   "123",
		Profile:    "uploads/profile/profile1.jpg",
		Phone:      "0945096372",
		PositionID: 1,
		RoleID:     1,
	}
	db.FirstOrCreate(&Admin, entity.Employee{Email: "admin@gmail.com"})

	// Hardware
	Hardware1 := entity.Hardware{
		Name:      "Hardware",
		IpAddress: "192.168.19.1",
	}
	db.FirstOrCreate(&Hardware1, entity.Hardware{Name: "Hardware"})

	// Room 1
	eid1 := uint(1)
	hid1 := uint(1)
	bid1 := uint(1)
	Room1 := entity.Room{
		RoomName:   "ห้องตรวจวิเคราะห์อากาศ",
		Floor:      1,
		EmployeeID: eid1,
		HardwareID: hid1,
		BuildingID: bid1,
	}
	db.FirstOrCreate(&Room1, entity.Room{RoomName: "ห้องตรวจวิเคราะห์อากาศ"})

	// Room 2
	bid2 := uint(2)
	Room2 := entity.Room{
		RoomName:   "ห้องควบคุมระบบเซนเซอร์",
		Floor:      1,
		EmployeeID: eid1,
		HardwareID: hid1,
		BuildingID: bid2,
	}
	db.FirstOrCreate(&Room2, entity.Room{RoomName: "ห้องควบคุมระบบเซนเซอร์"})

	// Room 3
	bid3 := uint(3)
	Room3 := entity.Room{
		RoomName:   "ห้องประมวลผลข้อมูลสิ่งแวดล้อม",
		Floor:      1,
		EmployeeID: eid1,
		HardwareID: hid1,
		BuildingID: bid3,
	}
	db.FirstOrCreate(&Room3, entity.Room{RoomName: "ห้องประมวลผลข้อมูลสิ่งแวดล้อม"})

}
