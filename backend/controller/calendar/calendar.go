package calendar

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
)

func ListCalendar(c *gin.Context) {
	var calendars []entity.Calendar

	db := config.DB()
	results := db.Preload("Employee").Find(&calendars)

	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, calendars)
}

func PostCalendar(c *gin.Context) {
	var calendar entity.Calendar
	if err := c.ShouldBindJSON(&calendar); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	if err := db.Create(&calendar).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, calendar)
}

func UpdateCalendar(c *gin.Context) {
	var calendar entity.Calendar
	id := c.Param("id")

	db := config.DB()
	if err := db.First(&calendar, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Calendar not found"})
		return
	}

	var input entity.Calendar
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// อัปเดตฟิลด์ที่เปลี่ยนแปลง
	calendar.Title = input.Title
	calendar.Location = input.Location
	calendar.Description = input.Description
	calendar.StartDate = input.StartDate
	calendar.EndDate = input.EndDate
	calendar.EmployeeID = input.EmployeeID

	if err := db.Save(&calendar).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, calendar)
}

func DeleteCalendar(c *gin.Context) {
	id := c.Param("id")

	db := config.DB()
	var calendar entity.Calendar
	if err := db.First(&calendar, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Calendar not found"})
		return
	}

	if err := db.Delete(&calendar).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Calendar deleted"})
}

