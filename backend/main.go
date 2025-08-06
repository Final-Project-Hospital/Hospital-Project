package main

import (
	"net/http"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/controller/bodcenter"
	"github.com/Tawunchai/hospital-project/controller/building"
	"github.com/Tawunchai/hospital-project/controller/calendar"
	"github.com/Tawunchai/hospital-project/controller/fogcenter"
	"github.com/Tawunchai/hospital-project/controller/report"

	"github.com/Tawunchai/hospital-project/controller/graph"
	"github.com/Tawunchai/hospital-project/controller/hardware"
	"github.com/Tawunchai/hospital-project/controller/logins"
	"github.com/Tawunchai/hospital-project/controller/room"
	"github.com/Tawunchai/hospital-project/controller/sensordata"

	"github.com/Tawunchai/hospital-project/controller/phcenter"
	"github.com/Tawunchai/hospital-project/controller/tdscenter"
	"github.com/Tawunchai/hospital-project/controller/tkncenter"
	"github.com/Tawunchai/hospital-project/controller/tscenter"

	"github.com/Tawunchai/hospital-project/controller/employee"
	"github.com/Tawunchai/hospital-project/controller/position"

	user "github.com/Tawunchai/hospital-project/controller/users"
	"github.com/Tawunchai/hospital-project/middlewares"

	"github.com/Tawunchai/hospital-project/controller/dashboard"
	"github.com/Tawunchai/hospital-project/controller/selectBoxAll"
	"github.com/gin-gonic/gin"
)

const PORT = "8000"

func main() {

	config.ConnectionDB()

	config.SetupDatabase()

	r := gin.Default()

	r.Use(CORSMiddleware())

	r.POST("/login", logins.AddLogin)

	authorized := r.Group("")
	authorized.Use(middlewares.Authorizes())
	{
		authorized.PATCH("/api/employees/:id/role", employee.UpdateRole)
		authorized.PUT("/api/employees/:id", employee.UpdateEmployeeInfo)
		authorized.DELETE("/api/employees/:id", employee.DeleteEmployee)
		authorized.GET("/dashboard/environmental", dashboard.GetEnvironmentalDashboard)

	}

	public := r.Group("")
	{
		public.GET("/users", user.ListUsers)
		public.GET("/uploads/*filename", user.ServeImage)
		public.GET("/user-data/:EmployeeID", user.GetDataByUserID)
		public.PATCH("/employees/:EmployeeID", user.UpdateEmployeeByID)
		public.POST("/signup", user.SignUpByUser)

		//PH
		public.POST("/create-ph", phcenter.CreatePH)
		public.GET("/get-first-ph", phcenter.GetfirstPH)
		public.GET("/list-ph", phcenter.ListPH)
		public.GET("/get-ph/:id", phcenter.GetPHbyID)
		public.GET("/get-ph-table", phcenter.GetPHTABLE)
		public.PATCH("/update-or-create-ph/:d", phcenter.UpdateOrCreatePH)
		public.DELETE("/delete-ph/:id", phcenter.DeletePH)
		public.DELETE("/delete-ph-day/:id", phcenter.DeleteAllPHRecordsByDate)

		//TDS
		public.POST("/create-tds", tdscenter.CreateTDS)
		public.GET("/get-first-tds", tdscenter.GetfirstTDS)
		public.GET("/list-tds", tdscenter.ListTDS)
		public.GET("/get-tds/:id", tdscenter.GetTDSbyID)
		public.GET("/get-tds-table", tdscenter.GetTDSTABLE)
		public.PATCH("/update-or-create-tds/:d", tdscenter.UpdateOrCreateTDS)
		public.DELETE("/delete-tds/:id", tdscenter.DeleteTDS)
		public.DELETE("/delete-tds-day/:id", tdscenter.DeleteAllTDSRecordsByDate)

		public.GET("/check-units", tdscenter.CheckUnit)
		public.GET("/check-standard", tdscenter.CheckStandard)

		
		//TKN
		public.POST("/create-tkn", tkncenter.CreateTKN)
		public.GET("/read-tkn", tkncenter.GetTKN)
		public.GET("/get-first-tkn", tkncenter.GetFirstTKN)
		public.GET("/read-tkn/:id", tkncenter.GetTKNbyID)
		public.PATCH("/update-tkn/:id", tkncenter.UpdateTKN)
		public.DELETE("/delete-tkn/:id", tkncenter.DeleteTKN)

		//TS
		public.POST("/create-ts", tscenter.CreateTS)
		public.GET("/read-ts", tscenter.GetTS)
		public.GET("/read-ts/:id", tscenter.GetTSbyID)
		public.PATCH("/update-ts/:id", tscenter.UpdateTS)
		public.DELETE("/delete-ts/:id", tscenter.DeleteTS)

		//BOD
		public.POST("/create-bod", bodcenter.CreateBod)
		public.GET("/get-first-bod", bodcenter.GetfirstBOD)
		public.GET("/list-bod", bodcenter.ListBOD)
		public.GET("/get-bod/:id", bodcenter.GetBODbyID)
		public.GET("/get-bod-table", bodcenter.GetBODTABLE)
		public.PATCH("/update-or-create-bod/:d", bodcenter.UpdateOrCreateBOD)
		public.DELETE("/delete-bod/:id", bodcenter.DeleteBOD)
		public.DELETE("/delete-bod-day/:id", bodcenter.DeleteAllBODRecordsByDate)
		// public.DELETE("/delete-bod/:id",bodcenter.DeleterBOD)

		//FOG
		public.POST("/create-fog", fogcenter.CreateFog)
		public.GET("/get-first-fog", fogcenter.GetfirstFOG)

		//Room
		public.GET("/rooms", room.ListRoom)
		public.POST("/create-rooms", room.CreateRoom)
		public.PATCH("/update-room/:id", room.UpdateRoom)
		public.DELETE("/delete-room/:id", room.DeleteRoomById)

		//Hardware
		public.GET("/hardwares", hardware.ListHardware)
		public.GET("/hardware-colors", hardware.ListColors)
		public.POST("/hardware/receive", hardware.ReceiveSensorData)
		public.GET("/hardware-parameter/by-hardware/:id", hardware.ListHardwareParameterByHardwareID)
		public.PATCH("/update-hardware-parameter/:id", hardware.UpdateHardwareParameterByID)
		public.GET("/hardware-parameter-ids", hardware.GetHardwareParametersWithGraph)
		public.PATCH("/hardware-parameters/:id/icon", hardware.UpdateIconByHardwareParameterID)
		public.PUT("/hardware-parameter/:id/group-display", hardware.UpdateGroupDisplayByID)

		//report hardware
		public.GET("/report-hardware", report.ListReportHardware)

		//ESP32
		public.POST("/hardware/read", hardware.ReadDataForHardware)

		//standard
		public.PUT("/update-unit-hardware/:id", hardware.UpdateUnitHardwareByID)
		public.PUT("/update-standard-hardware/:id", hardware.UpdateStandardHardwareByID)

		//Graph
		public.GET("/hardware-graphs", graph.ListDataGraph)

		//Building
		public.GET("/buildings", building.ListBuilding)

		// Sensorparameter
		public.GET("/data-sensorparameter", sensordata.ListDataSensorParameter)
		public.GET("/hardware-parameters-by-parameter", sensordata.ListDataHardwareParameterByParameter)
		public.GET("/sensor-data-parameters/:id", sensordata.GetSensorDataParametersBySensorDataID)
		public.GET("/sensor-data-by-hardware/:id", sensordata.GetSensorDataIDByHardwareID)

		//Calendar
		public.GET("/calendars", calendar.ListCalendar)
		public.POST("/create-calendar", calendar.PostCalendar)
		public.PUT("/update-calendar/:id", calendar.UpdateCalendar)
		public.DELETE("/delete-calendar/:id", calendar.DeleteCalendar)

		public.GET("/api/employees", employee.GetEmployees)
		public.POST("/api/employees", employee.CreateEmployee)

		//SelectBoxAll
		public.GET("/list-BeforeAfterTreatment", selectBoxAll.ListBeforeAfterTreatment)
		public.GET("/list-unit", selectBoxAll.ListUnit)
		public.GET("/api/positions", position.GetPositions)

		public.GET("/list-standard", selectBoxAll.ListStandard) //เก่า

		public.GET("/list-standard-middle", selectBoxAll.ListMiddleStandard)
		public.GET("/list-standard-range", selectBoxAll.ListRangeStandard)
		public.POST("/add-middle-standard", selectBoxAll.AddMiddleStandard)
		public.POST("/add-range-standard", selectBoxAll.AddRangeStandard)

		public.GET("/list-status", selectBoxAll.ListStatus)

		//public.GET("/api/water-quality", dashboard.GetWaterQuality)
		//public.GET("/dashboard/environmental", dashboard.GetEnvironmentalDashboard)

	}

	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)
	})

	r.Run("localhost:" + PORT)
	// r.Run("0.0.0.0:" + PORT)

}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}