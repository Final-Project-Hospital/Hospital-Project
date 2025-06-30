package main

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Tawunchai/hospital-project/config"

	"github.com/Tawunchai/hospital-project/controller/building"
	"github.com/Tawunchai/hospital-project/controller/calendar"
	"github.com/Tawunchai/hospital-project/controller/hardware"
	"github.com/Tawunchai/hospital-project/controller/logins"
	"github.com/Tawunchai/hospital-project/controller/sensordata"

	"github.com/Tawunchai/hospital-project/controller/users"

	"github.com/Tawunchai/hospital-project/middlewares"
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

	}

	public := r.Group("")
	{
		public.GET("/users", user.ListUsers)
		public.GET("/uploads/*filename", user.ServeImage)
		public.GET("/user-data/:userID", user.GetDataByUserID)

		//Room
		public.GET("/rooms", hardware.ListRoom)
		public.POST("/create-rooms", hardware.CreateRoom)

		//Hardware
		public.GET("/hardwares", hardware.ListHardware)

		//Building
		public.GET("/buildings", building.ListBuilding)

		//
		public.GET("/data-sensorparameter", sensordata.ListDataSensorParameter)

		//Calendar
		public.GET("/calendars", calendar.ListCalendar)
		public.POST("/create-calendar", calendar.PostCalendar)
		public.PUT("/update-calendar/:id", calendar.UpdateCalendar)
		public.DELETE("/delete-calendar/:id", calendar.DeleteCalendar)
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
