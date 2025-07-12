package selectBoxAll

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
)

// BeforeAfterTreatment
func ListBeforeAfterTreatment(c *gin.Context) {
	var list []entity.BeforeAfterTreatment

	if err := config.DB().Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้"})
		return
	}

	c.JSON(http.StatusOK, list)
}

// Unit
func ListUnit(c *gin.Context) {
	var list []entity.Unit

	if err := config.DB().Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้"})
		return
	}

	c.JSON(http.StatusOK, list)
}

// Standard
func ListStandard(c *gin.Context) {
	var list []entity.Standard

	if err := config.DB().Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้"})
		return
	}

	c.JSON(http.StatusOK, list)
}