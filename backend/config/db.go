package config

import (
	"fmt"
	"time"

	"github.com/Tawunchai/hospital-project/entity"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var db *gorm.DB

func DB() *gorm.DB {
	return db
}

func ConnectionDB() {
	dsn := "host=localhost user=postgres password=123456 dbname=HospitalDB port=5432 sslmode=disable TimeZone=Asia/Bangkok"

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Error),
	})
	if err != nil {
		panic("failed to connect to PostgreSQL database")
	}

	fmt.Println("✅ connected to PostgreSQL database")
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
		&entity.HardwareGraph{},
		&entity.HardwareParameter{},
		&entity.HardwareParameterColor{},
	)
	// Enviroment
	Wastewater := entity.Environment{
		EnvironmentName: "น้ำเสีย",
	}
	db.FirstOrCreate(&Wastewater, &entity.Environment{EnvironmentName: "น้ำเสีย"})

	// // Standaed
	// standardValues := []float32{5.0, 6.0, 7.0, 8.0, 9.0, 20.0, 30.0, 1.0, 500.0, 0.5, 35.0}
	// for _, val := range standardValues {
	// 	Standard := entity.Standard{StandardValue: val}
	// 	db.FirstOrCreate(&Standard, entity.Standard{StandardValue: val})
	// }

	// Standaed
	// จำลองข้อมูลแบบ "ค่าช่วง"
	ranges := []struct {
		min float32
		max float32
	}{
		{5.0, 9.0},
		{9.0, 10.0},
	}

	for _, r := range ranges {
		standard := entity.Standard{
			MinValue:    r.min,
			MaxValue:    r.max,
			MiddleValue: 0, // ไม่ใช้
		}
		db.FirstOrCreate(&standard, entity.Standard{
			MinValue:    r.min,
			MaxValue:    r.max,
			MiddleValue: 0,
		})
	}

	// จำลองข้อมูลแบบ "ค่าเดี่ยว"
	middles := []float32{20.0, 30.0, 35.0, 500.0}

	for _, m := range middles {
		standard := entity.Standard{
			MiddleValue: m,
			MinValue:    0, // ไม่ใช้
			MaxValue:    0,
		}
		db.FirstOrCreate(&standard, entity.Standard{
			MiddleValue: m,
			MinValue:    0,
			MaxValue:    0,
		})
	}

	// Unit
	Unit := entity.Unit{
		UnitName: "มิลลิกรัมต่อลิตร",
	}
	db.FirstOrCreate(&Unit, &entity.Unit{UnitName: "มิลลิกรัมต่อลิตร"})

	//BeforeAfter
	Before := entity.BeforeAfterTreatment{TreatmentName: "ก่อน"}
	After := entity.BeforeAfterTreatment{TreatmentName: "หลัง"}
	BeforeAndAfter := entity.BeforeAfterTreatment{TreatmentName: "ก่อนเเละหลัง"}
	db.FirstOrCreate(&Before, &entity.BeforeAfterTreatment{TreatmentName: "ก่อน"})
	db.FirstOrCreate(&After, &entity.BeforeAfterTreatment{TreatmentName: "หลัง"})
	db.FirstOrCreate(&BeforeAndAfter, &entity.BeforeAfterTreatment{TreatmentName: "ก่อนเเละหลัง"})

	// Roles
	AdminRole := entity.Role{RoleName: "Admin"}
	UserRole := entity.Role{RoleName: "User"}
	GuestRole := entity.Role{RoleName: "Guest"}

	db.FirstOrCreate(&AdminRole, &entity.Role{RoleName: "Admin"})
	db.FirstOrCreate(&UserRole, &entity.Role{RoleName: "User"})
	db.FirstOrCreate(&GuestRole, &entity.Role{RoleName: "Guest"})

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

	var colorCount, graphCount, paramCount int64

	db.Model(&entity.HardwareParameterColor{}).Count(&colorCount)
	db.Model(&entity.HardwareGraph{}).Count(&graphCount)
	db.Model(&entity.HardwareParameter{}).Count(&paramCount)

	if colorCount == 0 && graphCount == 0 && paramCount == 0 {
		// ----- สร้างสี -----
		colorPurple := entity.HardwareParameterColor{Color: "Purple", Code: "#800080"}
		colorBlue := entity.HardwareParameterColor{Color: "Blue", Code: "#1E90FF"}
		colorOrange := entity.HardwareParameterColor{Color: "Orange", Code: "#FFA500"}
		colorYellow := entity.HardwareParameterColor{Color: "Yellow", Code: "#FFD700"}
		colorGreen := entity.HardwareParameterColor{Color: "Green", Code: "#32CD32"}
		colorGray := entity.HardwareParameterColor{Color: "Gray", Code: "#808080"}

		db.FirstOrCreate(&colorPurple, entity.HardwareParameterColor{Color: "Purple"})
		db.FirstOrCreate(&colorBlue, entity.HardwareParameterColor{Color: "Blue"})
		db.FirstOrCreate(&colorOrange, entity.HardwareParameterColor{Color: "Orange"})
		db.FirstOrCreate(&colorYellow, entity.HardwareParameterColor{Color: "Yellow"})
		db.FirstOrCreate(&colorGreen, entity.HardwareParameterColor{Color: "Green"})
		db.FirstOrCreate(&colorGray, entity.HardwareParameterColor{Color: "Gray"})

		// ----- สร้างกราฟ -----
		defaultGraph := entity.HardwareGraph{Graph: "Line"}
		areaGraph := entity.HardwareGraph{Graph: "Area"}
		barGraph := entity.HardwareGraph{Graph: "Bar"}
		colorMappingGraph := entity.HardwareGraph{Graph: "Mapping"}
		stackedGraph := entity.HardwareGraph{Graph: "Stacked"}

		db.FirstOrCreate(&defaultGraph, entity.HardwareGraph{Graph: "Line"})
		db.FirstOrCreate(&areaGraph, entity.HardwareGraph{Graph: "Area"})
		db.FirstOrCreate(&barGraph, entity.HardwareGraph{Graph: "Bar"})
		db.FirstOrCreate(&colorMappingGraph, entity.HardwareGraph{Graph: "Mapping"})
		db.FirstOrCreate(&stackedGraph, entity.HardwareGraph{Graph: "Stacked"})

		// ----- สร้าง Parameter -----
		paramhardware1 := entity.HardwareParameter{
			Parameter:                "Formaldehyde",
			HardwareParameterColorID: colorGray.ID,
			HardwareGraphID:          defaultGraph.ID,
		}
		paramhardware2 := entity.HardwareParameter{
			Parameter:                "Temperature",
			HardwareParameterColorID: colorGray.ID,
			HardwareGraphID:          defaultGraph.ID,
		}
		paramhardware3 := entity.HardwareParameter{
			Parameter:                "Humidity",
			HardwareParameterColorID: colorGray.ID,
			HardwareGraphID:          defaultGraph.ID,
		}
		paramhardware4 := entity.HardwareParameter{
			Parameter:                "Light",
			HardwareParameterColorID: colorGray.ID,
			HardwareGraphID:          defaultGraph.ID,
		}
		paramhardware5 := entity.HardwareParameter{
			Parameter:                "Gas",
			HardwareParameterColorID: colorGray.ID,
			HardwareGraphID:          defaultGraph.ID,
		}

		db.FirstOrCreate(&paramhardware1, entity.HardwareParameter{Parameter: "Formaldehyde", HardwareGraphID: defaultGraph.ID})
		db.FirstOrCreate(&paramhardware2, entity.HardwareParameter{Parameter: "Temperature", HardwareGraphID: defaultGraph.ID})
		db.FirstOrCreate(&paramhardware3, entity.HardwareParameter{Parameter: "Humidity", HardwareGraphID: defaultGraph.ID})
		db.FirstOrCreate(&paramhardware4, entity.HardwareParameter{Parameter: "Light", HardwareGraphID: defaultGraph.ID})
		db.FirstOrCreate(&paramhardware5, entity.HardwareParameter{Parameter: "Gas", HardwareGraphID: defaultGraph.ID})
	}

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

	param1 := entity.Parameter{ParameterName: "Total Kjeldahl Nitrogen"}
	param2 := entity.Parameter{ParameterName: "Total Solid"}
	param3 := entity.Parameter{ParameterName: "Potential of Hydrogen"}
	param4 := entity.Parameter{ParameterName: "Total Dissolved Solids"}

	db.FirstOrCreate(&param1, entity.Parameter{ParameterName: "Total Kjeldahl Nitrogen"})
	db.FirstOrCreate(&param2, entity.Parameter{ParameterName: "Total Solid"})
	db.FirstOrCreate(&param3, entity.Parameter{ParameterName: "Potential of Hydrogen"})
	db.FirstOrCreate(&param4, entity.Parameter{ParameterName: "Total Dissolved Solids"})

	var count int64
	db.Model(&entity.SensorDataParameter{}).Count(&count)

	if count == 0 {
		index := 0
		for month := 1; month <= 12; month++ {
			for day := 1; day <= 20; day++ {
				date := time.Date(2025, time.Month(month), day, 0, 0, 0, 0, time.UTC)

				// Formaldehyde (HardwareParameterID = 1)
				param1 := entity.SensorDataParameter{
					Data:                0.1 + float64(month)*0.05 + float64(day)*0.002,
					SensorDataID:        1,
					HardwareParameterID: 1,
					Date:                date,
				}
				db.Create(&param1)
				index++

				// Temperature (HardwareParameterID = 2)
				param2 := entity.SensorDataParameter{
					Data:                20 + float64(month) + float64(day)*0.3 + float64((day%5)-2),
					SensorDataID:        1,
					HardwareParameterID: 2,
					Date:                date,
				}
				db.Create(&param2)
				index++

				// Humidity (HardwareParameterID = 3)
				param3 := entity.SensorDataParameter{
					Data:                40 + float64(month)*2 + float64(day)*0.8 + float64((day%7)-3),
					SensorDataID:        1,
					HardwareParameterID: 3,
					Date:                date,
				}
				db.Create(&param3)
				index++

				// Light (HardwareParameterID = 4)
				param4 := entity.SensorDataParameter{
					Data:                100 + float64(month)*10 + float64(day)*2,
					SensorDataID:        1,
					HardwareParameterID: 4,
					Date:                date,
				}
				db.Create(&param4)
				index++

				// Gas (HardwareParameterID = 5)
				param5 := entity.SensorDataParameter{
					Data:                5 + float64(month)*0.4 + float64(day)*0.1,
					SensorDataID:        1,
					HardwareParameterID: 5,
					Date:                date,
				}
				db.Create(&param5)
				index++
			}
		}
		println("✅ เพิ่มข้อมูล SensorDataParameter ทั้งหมด", index, "records พร้อมวันที่")
	} else {
		println("⚠️  ข้ามการเพิ่มข้อมูล SensorDataParameter เพราะมีข้อมูลอยู่แล้ว")
	}
	// environment := entity.Environment{EnvironmentName: "น้ำเสีย"}
	// db.FirstOrCreate(&environment, &entity.Environment{EnvironmentName: "น้ำเสีย"})

	// BodStandard := entity.Standard{StandardValue: 20}
	// db.FirstOrCreate(&BodStandard, &entity.Standard{StandardValue: 20})

	// BodUnit := entity.Unit{UnitName: "mg/L"}
	// db.FirstOrCreate(&BodUnit, &entity.Unit{UnitName: "mg/L"})

	BodParameter := entity.Parameter{ParameterName: "Biochemical Oxygen Demand"}
	db.FirstOrCreate(&BodParameter, &entity.Parameter{ParameterName: "Biochemical Oxygen Demand"})

}
