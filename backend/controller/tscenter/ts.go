package tscenter

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
)

func CreateTS(c *gin.Context) {
	var input entity.EnvironmentalRecord

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?","Total Solid").First(&parameter).Error; err != nil {
		fmt.Println("Error fetching parameter:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	var environment entity.Environment
	if err := db.Where("environment_name = ?","น้ำเสีย").First(&environment).Error; err != nil {
		fmt.Println("Error fetching environment:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid environment"})
		return
	}

	ts := entity.EnvironmentalRecord{
		Date:                   input.Date,
		Data:                   input.Data,
		Note: 					input.Note,
		BeforeAfterTreatmentID: input.BeforeAfterTreatmentID,
		EnvironmentID:          environment.ID, 
		ParameterID:            parameter.ID,
		StandardID:             input.StandardID,
		UnitID:                 input.UnitID,
		EmployeeID:             input.EmployeeID,
	}

	if err := db.Create(&ts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "บันทึกข้อมูล TS สำเร็จ", "data": ts})
}

func GetTS(c *gin.Context) {
	var ts []entity.EnvironmentalRecord

	db := config.DB()

	result := db.Preload("BeforeAfterTreatment").
		Preload("Environment").
		Preload("Parameter").
		Preload("Standard").
		Preload("Unit").
		Preload("Employee").
		Find(&ts)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, ts)
}

func GetTSbyID(c *gin.Context) {
	id := c.Param("id")

	var ts entity.EnvironmentalRecord

	db := config.DB()

	result := db.Preload("BeforeAfterTreatment").
		Preload("Environment").
		Preload("Parameter").
		Preload("Standard").
		Preload("Unit").
		Preload("Employee").
		First(&ts, id)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูล"})
		return
	}

	c.JSON(http.StatusOK, ts)
}

func UpdateTS(c *gin.Context) {
	var ts entity.EnvironmentalRecord
	id := c.Param("id")
	uintID, err := strconv.ParseUint(id, 10, 32)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID ไม่ถูกต้อง"})
		return
	}

	db := config.DB()

	if err := db.First(&ts, uint(uintID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูล"})
		return
	}

	var input entity.EnvironmentalRecord
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ts.Date = input.Date
	ts.Data = input.Data
	ts.BeforeAfterTreatmentID = input.BeforeAfterTreatmentID
	ts.EnvironmentID = input.EnvironmentID
	ts.ParameterID = input.ParameterID
	ts.StandardID = input.StandardID
	ts.UnitID = input.UnitID
	ts.EmployeeID = input.EmployeeID

	if err := db.Save(&ts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "อัปเดตข้อมูล TS สำเร็จ", "data": ts})
}

func DeleteTS(c *gin.Context) {
	id := c.Param("id")
	uintID, err := strconv.ParseUint(id, 10, 32)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID ไม่ถูกต้อง"})
		return
	}

	db := config.DB()

	if err := db.Delete(&entity.EnvironmentalRecord{}, uint(uintID)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ลบข้อมูล TS สำเร็จ"})
}
