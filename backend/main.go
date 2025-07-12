package main

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Tawunchai/hospital-project/config"

	"github.com/Tawunchai/hospital-project/controller/building"
	"github.com/Tawunchai/hospital-project/controller/calendar"
	"github.com/Tawunchai/hospital-project/controller/hardware"
	"github.com/Tawunchai/hospital-project/controller/logins"
	"github.com/Tawunchai/hospital-project/controller/room"
	"github.com/Tawunchai/hospital-project/controller/sensordata"

	"github.com/Tawunchai/hospital-project/controller/phcenter"
	"github.com/Tawunchai/hospital-project/controller/tdscenter"
	"github.com/Tawunchai/hospital-project/controller/tkncenter"
	"github.com/Tawunchai/hospital-project/controller/tscenter"

	"github.com/Tawunchai/hospital-project/controller/employee"

	"github.com/Tawunchai/hospital-project/controller/users"

	"github.com/Tawunchai/hospital-project/middlewares"

	"github.com/Tawunchai/hospital-project/controller/selectBoxAll"
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
	}

	public := r.Group("")
	{
		public.GET("/users", user.ListUsers)
		public.GET("/uploads/*filename", user.ServeImage)
		public.GET("/user-data/:userID", user.GetDataByUserID)

		//PH
		public.POST("/create-ph", phcenter.CreatePH)
		public.GET("/get-ph", phcenter.GetPH)
		public.GET("/get-ph/:id", phcenter.GetPHbyID)
		public.PATCH("/update-ph/:id", phcenter.UpdatePH)
		public.DELETE("/delete-ph/:id", phcenter.DeletePH)

		//TDS
		public.POST("/create-tds", tdscenter.CreateTDS)
		public.GET("/get-tds", tdscenter.GetTDS)
		public.GET("/get-tds/:id", tdscenter.GetTDSbyID)
		public.PATCH("/update-tds/:id", tdscenter.UpdateTDS)
		public.DELETE("/delete-tds/:id", tdscenter.DeleteTDS)

		//TKN
		public.POST("/create-tkn", tkncenter.CreateTKN)
		public.GET("/read-tkn", tkncenter.GetTKN)
		public.GET("read-tkn/:id", tkncenter.GetTKNbyID)
		public.PATCH("/update-tkn/:id", tkncenter.UpdateTKN)
		public.DELETE("/delete-tkn/:id", tkncenter.DeleteTKN)

		//TS
		public.POST("/create-ts", tscenter.CreateTS)
		public.GET("/read-ts", tscenter.GetTS)
		public.GET("read-ts/:id", tscenter.GetTSbyID)
		public.PATCH("/update-ts/:id", tscenter.UpdateTS)
		public.DELETE("/delete-ts/:id", tscenter.DeleteTS)

		//Room
		public.GET("/rooms", room.ListRoom)
		public.POST("/create-rooms", room.CreateRoom)
		public.PATCH("/update-room/:id", room.UpdateRoom) 
		public.DELETE("/delete-room/:id", room.DeleteRoomById)

		//Hardware
		public.GET("/hardwares", hardware.ListHardware)
		public.POST("/hardware/receive", hardware.ReceiveSensorData)

		//Building
		public.GET("/buildings", building.ListBuilding)

		// Sensorparameter
		public.GET("/data-sensorparameter", sensordata.ListDataSensorParameter)
		public.GET("/sensor-data-parameters/:id", sensordata.GetSensorDataParametersBySensorDataID)
		public.GET("/sensor-data-by-hardware/:id", sensordata.GetSensorDataIDByHardwareID)

		//Calendar
		public.GET("/calendars", calendar.ListCalendar)
		public.POST("/create-calendar", calendar.PostCalendar)
		public.PUT("/update-calendar/:id", calendar.UpdateCalendar)
		public.DELETE("/delete-calendar/:id", calendar.DeleteCalendar)

		public.GET("/api/employees", employee.GetEmployees)

		//SelectBoxAll
		public.GET("/list-BeforeAfterTreatment", selectBoxAll.ListBeforeAfterTreatment)
		public.GET("/list-unit", selectBoxAll.ListUnit)
		public.GET("/list-standard", selectBoxAll.ListStandard)
	}

	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)
	})

	r.Run("localhost:" + PORT)

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