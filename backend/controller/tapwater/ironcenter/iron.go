package ironcenter

import (
	"errors"
	"fmt"
	"net/http"
	// "strconv"
	"time"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func CreateFe(c *gin.Context) {
	fmt.Println(("Creating Environment Record"))

	var input struct{
		Data                   float64
		Date                   time.Time
		Note                   string
		BeforeAfterTreatmentID uint
		EnvironmentID          uint
		ParameterID            uint
		StandardID             uint
		UnitID                 uint
		EmployeeID             uint
		CustomUnit             string
	}
	
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	if input.CustomUnit != "" {
		var existingUnit entity.Unit
		if err := db.Where("unit_name = ?", input.CustomUnit).First(&existingUnit).Error; err == nil {
			// เจอ unit ที่มีอยู่แล้ว
			input.UnitID = existingUnit.ID
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			// ไม่เจอ unit -> สร้างใหม่
			newUnit := entity.Unit{
				UnitName: input.CustomUnit,
			}
			if err := db.Create(&newUnit).Error; err != nil {
				fmt.Println("ไม่สามารถสร้างหน่วยใหม่ได้:", err) // แค่ขึ้น log
				// ไม่คืน error ไปยัง frontend
			} else {
				input.UnitID = newUnit.ID
			}
		} else {
			// เกิด error อื่นขณะเช็กหน่วย
			fmt.Println(" เกิดข้อผิดพลาดในการตรวจสอบหน่วย:", err) // แค่ขึ้น log
			// ไม่คืน error ไปยัง frontend
		}
	}

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?","Iron").First(&parameter).Error; err != nil {
		fmt.Println("Error fetching parameter:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	var environment entity.Environment
	if err := db.Where("environment_name = ?","น้ำประปา").First(&environment).Error; err != nil {
		fmt.Println("Error fetching environment:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid environment"})
		return
	}
	var standard entity.Standard
	if err := db.First(&standard, input.StandardID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบข้อมูลเกณฑ์มาตรฐาน"})
		return
	}
	
	getStatusID := func(value float64) uint {
		var status entity.Status
		if standard.MiddleValue != 0 {
			if value <= float64(standard.MiddleValue) {
				db.Where("status_name = ?", "อยู่ในเกณฑ์มาตรฐาน").First(&status)
			} else {
				db.Where("status_name = ?", "เกินเกณฑ์มาตรฐาน").First(&status)
			}
		} else {
			if value >= float64(standard.MinValue) && value <= float64(standard.MaxValue) {
				db.Where("status_name = ?", "อยู่ในเกณฑ์มาตรฐาน").First(&status)
			} else if value > float64(standard.MaxValue) {
				db.Where("status_name = ?", "เกินเกณฑ์มาตรฐาน").First(&status)
			} else {
				db.Where("status_name = ?", "ตํ่ากว่าเกณฑ์มาตรฐาน").First(&status)
			}
		}
		return status.ID
	}

	tcb := entity.EnvironmentalRecord{
		Date:                   input.Date,  
		Data:                   input.Data,
		Note:					input.Note,
		BeforeAfterTreatmentID: input.BeforeAfterTreatmentID,
		EnvironmentID:          environment.ID, 
		ParameterID:            parameter.ID,
		StandardID:             input.StandardID,
		UnitID:                 input.UnitID,
		EmployeeID:             input.EmployeeID,
		StatusID:               getStatusID(input.Data),
	}

	if err := db.Create(&tcb).Error; err != nil {
		fmt.Println("Error saving Iron:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not save Iron"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "บันทึกข้อมูล Iron สำเร็จ", 
		"data": tcb})
}

func GetFirstIron(c *gin.Context) {
	db := config.DB()

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "Iron").First(&parameter).Error; err != nil {
		fmt.Println("Parameter not found:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parameter FCB not found"})
		return
	}

	// โครงสร้างสำหรับจัดเก็บข้อมูลผลลัพธ์ล่าสุดของ TKN
	var firstTKN struct {
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

	result := db.Model(&entity.EnvironmentalRecord{}).
		Select(`environmental_records.id, environmental_records.date, environmental_records.data, environmental_records.note,
				environmental_records.before_after_treatment_id, environmental_records.environment_id,
				environmental_records.parameter_id, environmental_records.standard_id, environmental_records.unit_id,
				environmental_records.employee_id,
				standards.min_value, standards.middle_value, standards.max_value`).
		Joins("INNER JOIN standards ON environmental_records.standard_id = standards.id").
		Where("parameter_id = ?", parameter.ID).
		Order("environmental_records.created_at desc").
		Limit(1). // ดึงแค่เรคคอร์ดเดียว
		Scan(&firstTKN)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, firstTKN)
}