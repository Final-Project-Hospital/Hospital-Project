package hardware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
)

func ListHardware(c *gin.Context) {
	var hardwares []entity.Hardware

	db := config.DB()
	if err := db.Find(&hardwares).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, hardwares)
}
