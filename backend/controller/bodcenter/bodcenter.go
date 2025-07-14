package bodcenter

import (
	"fmt"
	"net/http"
	"time"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
)

func CreateBod(c *gin.Context) {
	fmt.Println("Creating Environment Record")

	var input struct {
		Data                   float32
		BeforeAfterTreatmentID uint
		EnvironmentID          uint
		ParameterID            uint
		StandardID             uint
		UnitID                 uint
		EmployeeID             uint
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		fmt.Println("Error binding JSON:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?","Biochemical Oxygen Demand").First(&parameter).Error; err != nil {
		fmt.Println("Error fetching parameter:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	environmentRecord := entity.EnvironmentalRecord{
		Date:                   time.Now(),
		Data:                   input.Data,
		BeforeAfterTreatmentID: input.BeforeAfterTreatmentID,
		EnvironmentID:          1,
		ParameterID:            parameter.ID, // แก้ตรงนี้
		StandardID:             input.StandardID,
		UnitID:                 input.UnitID,
		EmployeeID:             input.EmployeeID,
	}

	if err := db.Create(&environmentRecord).Error; err != nil {
		fmt.Println("Error saving environment record:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not save EnvironmentRecord"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Environment record created successfully", // แก้ข้อความตรงนี้
		"data":    environmentRecord,
	})
}