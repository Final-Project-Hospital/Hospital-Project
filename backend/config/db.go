package config

import (
	"fmt"
	"time"

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
		&entity.Calendar{},
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

	calendar_eid := uint(1)

	calendar1 := entity.Calendar{
		Title:       "Staff Meeting",
		Location:    "Room A101",
		Description: "Monthly all-staff meeting",
		StartDate:   time.Date(2025, 7, 1, 9, 0, 0, 0, time.Local),
		EndDate:     time.Date(2025, 7, 1, 10, 30, 0, 0, time.Local),
		EmployeeID:  &calendar_eid,
	}

	calendar2 := entity.Calendar{
		Title:       "EV Maintenance",
		Location:    "EV Station Zone B",
		Description: "Routine maintenance for EV chargers",
		StartDate:   time.Date(2025, 7, 3, 13, 0, 0, 0, time.Local),
		EndDate:     time.Date(2025, 7, 3, 15, 0, 0, 0, time.Local),
		EmployeeID:  &calendar_eid,
	}

	db.FirstOrCreate(&calendar1, entity.Calendar{Title: "Staff Meeting"})
	db.FirstOrCreate(&calendar2, entity.Calendar{Title: "EV Maintenance"})

	SensorData1 := entity.SensorData{
		Date:       time.Date(2025, 6, 30, 14, 30, 0, 0, time.UTC),
		HardwareID: 1,
	}

	db.FirstOrCreate(&SensorData1, entity.SensorData{HardwareID: SensorData1.HardwareID})

	param1 := entity.Parameter{ParameterName: "Formaldehyde"}
	param2 := entity.Parameter{ParameterName: "Temperature"}
	param3 := entity.Parameter{ParameterName: "Humidity"}

	db.FirstOrCreate(&param1, entity.Parameter{ParameterName: "Formaldehyde"})
	db.FirstOrCreate(&param2, entity.Parameter{ParameterName: "Temperature"})
	db.FirstOrCreate(&param3, entity.Parameter{ParameterName: "Humidity"})

	var count int64
	db.Model(&entity.SensorDataParameter{}).Count(&count)

	if count == 0 {
		index := 0
		for i := 0; i < 40; i++ {
			month := (i / 10) + 1 // เดือนที่ 1-4
			day := (i % 10) + 1   // วันที่ 1-10
			date := time.Date(2025, time.Month(month), day, 0, 0, 0, 0, time.UTC)

			// Formaldehyde (ParameterID = 1)
			param1 := entity.SensorDataParameter{
				Data:         float64(0.1 + float64(i)*0.01),
				SensorDataID: 1,
				ParameterID:  1,
				Date:         date,
			}
			db.Create(&param1)
			index++

			// Temperature (ParameterID = 2)
			param2 := entity.SensorDataParameter{
				Data:         float64(25 + i%5),
				SensorDataID: 1,
				ParameterID:  2,
				Date:         date,
			}
			db.Create(&param2)
			index++

			// Humidity (ParameterID = 3)
			param3 := entity.SensorDataParameter{
				Data:         float64(50 + i%10),
				SensorDataID: 1,
				ParameterID:  3,
				Date:         date,
			}
			db.Create(&param3)
			index++
		}

		println("✅ เพิ่มข้อมูล SensorDataParameter ทั้งหมด 120 records พร้อมวันที่")
	} else {
		println("⚠️  ข้ามการเพิ่มข้อมูล SensorDataParameter เพราะมีข้อมูลอยู่แล้ว")
	}

}
