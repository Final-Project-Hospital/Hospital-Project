package phcenter

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func CreatePH(c *gin.Context) {
	var rawData map[string]interface{}
	if err := c.ShouldBindJSON(&rawData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// แปลงค่าพื้นฐานจาก rawData
	dateStr := rawData["Date"].(string)
	dateParsed, err := time.Parse(time.RFC3339, dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
		return
	}

	standardID := uint(rawData["StandardID"].(float64))
	// unitID := uint(rawData["UnitID"].(float64))
	employeeID := uint(rawData["EmployeeID"].(float64))
	note := ""
	if rawData["Note"] != nil {
		note = rawData["Note"].(string)
	}
	beforeAfterID := int(rawData["BeforeAfterTreatmentID"].(float64))

	// เชื่อมฐานข้อมูล
	db := config.DB()
	var unitID uint
	if rawUnit, ok := rawData["UnitID"]; ok && rawUnit != nil {
		if unitFloat, ok := rawUnit.(float64); ok {
			unitID = uint(unitFloat)
		}
	}

	customUnit, hasCustomUnit := rawData["CustomUnit"].(string)
	if hasCustomUnit && customUnit != "" {
		var existingUnit entity.Unit
		if err := db.Where("unit_name = ?", customUnit).First(&existingUnit).Error; err == nil {
			unitID = existingUnit.ID
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			newUnit := entity.Unit{UnitName: customUnit}
			if err := db.Create(&newUnit).Error; err != nil {
				fmt.Println("ไม่สามารถสร้างหน่วยใหม่ได้:", err)
			} else {
				unitID = newUnit.ID
			}
		} else {
			fmt.Println("เกิดข้อผิดพลาดในการตรวจสอบหน่วย:", err)
		}
	}

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "Potential of Hydrogen").First(&parameter).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	var environment entity.Environment
	if err := db.Where("environment_name = ?", "น้ำเสีย").First(&environment).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid environment"})
		return
	}

	if beforeAfterID == 3 {
		// สร้าง 2 record แยก ก่อน และ หลัง
		valueBefore := rawData["valueBefore"].(float64)
		valueAfter := rawData["valueAfter"].(float64)

		recordBefore := entity.EnvironmentalRecord{
			Date:                   dateParsed,
			Data:                   valueBefore,
			BeforeAfterTreatmentID: 1,
			EnvironmentID:          environment.ID,
			ParameterID:            parameter.ID,
			StandardID:             standardID,
			UnitID:                 unitID,
			EmployeeID:             employeeID,
			Note:                   note,
		}

		recordAfter := entity.EnvironmentalRecord{
			Date:                   dateParsed,
			Data:                   valueAfter,
			BeforeAfterTreatmentID: 2,
			EnvironmentID:          environment.ID,
			ParameterID:            parameter.ID,
			StandardID:             standardID,
			UnitID:                 unitID,
			EmployeeID:             employeeID,
			Note:                   note,
		}

		if err := db.Create(&recordBefore).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if err := db.Create(&recordAfter).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"message": "บันทึกข้อมูล pH ก่อนเเละหลังบำบัดสำเร็จ", "before": recordBefore, "after": recordAfter})
		return
	}

	// สร้างกรณีทั่วไป 1 record
	data := rawData["Data"].(float64)

	record := entity.EnvironmentalRecord{
		Date:                   dateParsed,
		Data:                   data,
		BeforeAfterTreatmentID: uint(beforeAfterID),
		EnvironmentID:          environment.ID,
		ParameterID:            parameter.ID,
		StandardID:             standardID,
		UnitID:                 unitID,
		EmployeeID:             employeeID,
		Note:                   note,
	}

	if err := db.Create(&record).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "บันทึกข้อมูล pH สำเร็จ", "data": record})
}

func GetPH(c *gin.Context) {
	var ph []entity.EnvironmentalRecord

	db := config.DB()

	result := db.Preload("BeforeAfterTreatment").
		Preload("Environment").
		Preload("Parameter").
		Preload("Standard").
		Preload("Unit").
		Preload("Employee").
		Find(&ph)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, ph)
}

func GetPHbyID(c *gin.Context) {
	id := c.Param("id")

	var ph entity.EnvironmentalRecord

	db := config.DB()

	result := db.Preload("BeforeAfterTreatment").
		Preload("Environment").
		Preload("Parameter").
		Preload("Standard").
		Preload("Unit").
		Preload("Employee").
		First(&ph, id)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูล"})
		return
	}

	c.JSON(http.StatusOK, ph)
}

func UpdatePH(c *gin.Context) {
	var ph entity.EnvironmentalRecord
	id := c.Param("id")
	uintID, err := strconv.ParseUint(id, 10, 32)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID ไม่ถูกต้อง"})
		return
	}

	db := config.DB()

	if err := db.First(&ph, uint(uintID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูล"})
		return
	}

	var input entity.EnvironmentalRecord
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ph.Date = input.Date
	ph.Data = input.Data
	ph.BeforeAfterTreatmentID = input.BeforeAfterTreatmentID
	ph.EnvironmentID = input.EnvironmentID
	ph.ParameterID = input.ParameterID
	ph.StandardID = input.StandardID
	ph.UnitID = input.UnitID
	ph.EmployeeID = input.EmployeeID
	ph.Note = input.Note

	if err := db.Save(&ph).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "อัปเดตข้อมูล pH สำเร็จ", "data": ph})
}

func DeletePH(c *gin.Context) {
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

	c.JSON(http.StatusOK, gin.H{"message": "ลบข้อมูล pH สำเร็จ"})
}

func GetfirstPH(c *gin.Context) {
	db := config.DB()

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "Potential of Hydrogen").First(&parameter).Error; err != nil {
		fmt.Println("Error fetching parameter:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	// โครงสร้างสำหรับจัดเก็บข้อมูลผลลัพธ์
	var firstph struct {
		ID                     uint      `json:"ID"`
		Date                   time.Time `json:"Date"`
		Data                   float64   `json:"Data"`
		Note                   string    `json:"Note"`
		BeforeAfterTreatmentID uint      `json:"BeforeAfterTreatmentID"`
		EnvironmentID          uint      `json:"EnvironmentID"`
		ParameterID            uint      `json:"ParameterID"`
		StandardID             uint      `json:"StandardID"`
		UnitID                 uint      `json:"UnitID"`
		EmployeeID             uint      `json:"EmployeeID"`
		MinValue               uint      `json:"MinValue"`
		MiddleValue            uint      `json:"MiddleValue"`
		MaxValue               uint      `json:"MaxValue"`
	}

	// คำสั่ง SQL ที่แก้ไขให้ใช้ DISTINCT ใน GROUP_CONCAT
	result := db.Model(&entity.EnvironmentalRecord{}).
		Select(`environmental_records.id, environmental_records.date, environmental_records.data, environmental_records.note,environmental_records.before_after_treatment_id,environmental_records.environment_id ,environmental_records.parameter_id ,environmental_records.standard_id ,environmental_records.unit_id ,environmental_records.employee_id,standards.min_value,standards.middle_value,standards.max_value`).
		Joins("inner join standards on environmental_records.standard_id = standards.id").
		Where("parameter_id = ?", parameter.ID).
		Order("environmental_records.created_at desc").
		Scan(&firstph)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, firstph)
}
