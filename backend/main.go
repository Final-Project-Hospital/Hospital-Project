package main

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/Tawunchai/hospital-project/config"

	"github.com/Tawunchai/hospital-project/controller/genders"

	"github.com/Tawunchai/hospital-project/controller/logins"

	"github.com/Tawunchai/hospital-project/controller/users"

	"github.com/Tawunchai/hospital-project/middlewares"
)

const PORT = "8000"

func main() {

	// open connection database
	config.ConnectionDB()

	// Generate databases
	config.SetupDatabase()

	r := gin.Default()

	r.Use(CORSMiddleware())

	r.POST("/login", logins.AddLogin)

	authorized := r.Group("")
	authorized.Use(middlewares.Authorizes())
	{
		// ยังไม่ได้ใช่ช่อง Athentication นะ
	}

	public := r.Group("")
	{
		public.PUT("/user/:id", users.Update)
		public.GET("/users", users.GetAll)
		public.GET("/user/:id", users.Get)
		public.DELETE("/user/:id", users.Delete)

		r.GET("/genders", genders.GetAll)
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
