package building

import (
	"net/http"
	"strconv"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
)

func ListBuilding(c *gin.Context) {
	var buildings []entity.Building

	db := config.DB()
	if err := db.Find(&buildings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, buildings)
}

// ✅ CreateBuilding
func CreateBuilding(c *gin.Context) {
	var building entity.Building

	// Bind JSON
	if err := c.ShouldBindJSON(&building); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	if err := db.Create(&building).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, building)
}

// ✅ UpdateBuildingByID
func UpdateBuildingByID(c *gin.Context) {
	id := c.Param("id")
	buildingID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid building ID"})
		return
	}

	var building entity.Building
	db := config.DB()

	// Find old record
	if err := db.First(&building, buildingID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Building not found"})
		return
	}

	// Bind new JSON
	var input entity.Building
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	building.BuildingName = input.BuildingName

	if err := db.Save(&building).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, building)
}

// ✅ DeleteBuildingByID
func DeleteBuildingByID(c *gin.Context) {
	id := c.Param("id")
	buildingID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid building ID"})
		return
	}

	db := config.DB()
	var building entity.Building

	if err := db.First(&building, buildingID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Building not found"})
		return
	}

	if err := db.Delete(&building).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Building deleted successfully"})
}
