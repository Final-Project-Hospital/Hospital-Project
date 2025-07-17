package position

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
)

// GetPositions ดึงตำแหน่งทั้งหมด
func GetPositions(c *gin.Context) {
	db := config.DB()

	var positions []entity.Position
	if err := db.Find(&positions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลตำแหน่งได้"})
		return
	}

	c.JSON(http.StatusOK, positions)
}
