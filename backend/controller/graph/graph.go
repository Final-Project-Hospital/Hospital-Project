package graph

import (
	"net/http"
	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
)

func ListDataGraph(c *gin.Context) {
	var graphs []entity.HardwareGraph

	db := config.DB()
	results := db.Preload("HardwareParameter").Find(&graphs)

	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, graphs)
}