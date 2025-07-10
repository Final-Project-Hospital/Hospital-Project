package main

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Tawunchai/hospital-project/config"

	"github.com/Tawunchai/hospital-project/controller/logins"

	"github.com/Tawunchai/hospital-project/controller/users"

	"github.com/Tawunchai/hospital-project/middlewares"

	"github.com/Tawunchai/hospital-project/controller/employee"
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
		public.GET("/api/employees", employee.GetEmployees)
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
