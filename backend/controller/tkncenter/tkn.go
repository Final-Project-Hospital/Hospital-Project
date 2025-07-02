package tkncenter

import (
	"net/http"
	"strconv"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
)

func CreateTKN(c *gin.Context) {
	var input entity.EnvironmentalRecord

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	tkn := entity.EnvironmentalRecord{
		Date:                   input.Date,  
		Data:                   input.Data,
		BeforeAfterTreatmentID: input.BeforeAfterTreatmentID,
		EnvironmentID:          input.EnvironmentID,
		ParameterID:            input.ParameterID,
		StandardID:             input.StandardID,
		UnitID:                 input.UnitID,
		EmployeeID:             input.EmployeeID,
	}

	if err := db.Create(&tkn).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "บันทึกข้อมูลสำเร็จ", "data": tkn})
}

func GetTKN(c *gin.Context) {
	var tkn []entity.EnvironmentalRecord

	db := config.DB()

	result := db.Preload("BeforeAfterTreatment").
		Preload("Environment").
		Preload("Parameter").
		Preload("Standard").
		Preload("Unit").
		Preload("Employee").
		Find(&tkn)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, tkn)
}

func UpdateTKN(c *gin.Context) {
	var tkn entity.EnvironmentalRecord
	id := c.Param("id")
	uintID, err := strconv.ParseUint(id, 10, 32)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID ไม่ถูกต้อง"})
		return
	}

	db := config.DB()

	if err := db.First(&tkn, uint(uintID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูล"})
		return
	}

	var input entity.EnvironmentalRecord
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tkn.Date = input.Date
	tkn.Data = input.Data
	tkn.BeforeAfterTreatmentID = input.BeforeAfterTreatmentID
	tkn.EnvironmentID = input.EnvironmentID
	tkn.ParameterID = input.ParameterID
	tkn.StandardID = input.StandardID
	tkn.UnitID = input.UnitID
	tkn.EmployeeID = input.EmployeeID

	if err := db.Save(&tkn).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "อัปเดตข้อมูลสำเร็จ", "data": tkn})
}

func DeleteTKN(c *gin.Context) {
	id := c.Param("id")
	uintID, err := strconv.ParseUint(id, 10, 32)

	db := config.DB()

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID ไม่ถูกต้อง"})
	return
	}

	if err := db.Delete(&entity.EnvironmentalRecord{}, uint(uintID)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ลบข้อมูลสำเร็จ"})
}
