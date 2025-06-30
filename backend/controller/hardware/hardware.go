package hardware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
)

func ListRoom(c *gin.Context) {
	var rooms []entity.Room

	db := config.DB()

	if err := db.Preload("Building").Preload("Employee").Preload("Hardware").Find(&rooms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, &rooms)
}

func CreateRoom(c *gin.Context) {
	var room entity.Room

	if err := c.ShouldBindJSON(&room); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := config.DB().Create(&room).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, room)
}

func ListHardware(c *gin.Context) {
	var hardwares []entity.Hardware

	db := config.DB()
	if err := db.Find(&hardwares).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, hardwares)
}
