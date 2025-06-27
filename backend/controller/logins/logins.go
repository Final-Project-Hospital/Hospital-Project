package logins

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/Tawunchai/hospital-project/services"
)

func AddLogin(c *gin.Context) {
	var loginData entity.Employee
	if err := c.ShouldBindJSON(&loginData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}
	db := config.DB()

	var user entity.Employee
	if err := db.Preload("Role").Where("email = ? AND password = ?", loginData.Email, loginData.Password).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	jwtWrapper := services.JwtWrapper{
		SecretKey:       "RhE9Q6zyV8Ai5jnPq2ZDsXMmLuy5eNkw",
		Issuer:          "AuthService",
		ExpirationHours: 24,
	}

	signedToken, err := jwtWrapper.GenerateToken(user.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "error signing token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token_type":    "Bearer",
		"token":         signedToken,
		"Role":      	 user.Role,
		"UserID":    	 user.ID,
		"FirstNameUser": user.FirstName,
		"LastNameUser":  user.LastName,
	})

}