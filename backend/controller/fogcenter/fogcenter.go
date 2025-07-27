package fogcenter

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func CreateFog(c *gin.Context) {
	fmt.Println("Creating Environment Record")

	var input struct {
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
		fmt.Println("Error binding JSON:", err)
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
				fmt.Println(" ไม่สามารถสร้างหน่วยใหม่ได้:", err) // แค่ขึ้น log
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
	if err := db.Where("parameter_name = ?","Fat Oil and Grease").First(&parameter).Error; err != nil {
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

	environmentRecord := entity.EnvironmentalRecord{
		Date:                   input.Date,
		Data:                   input.Data,
		Note:                   input.Note,
		BeforeAfterTreatmentID: input.BeforeAfterTreatmentID,
		EnvironmentID:          environment.ID,
		ParameterID:            parameter.ID, // แก้ตรงนี้
		StandardID:             input.StandardID,
		UnitID:                 input.UnitID,
		EmployeeID:             input.EmployeeID,
	}

	if err := db.Create(&environmentRecord).Error; err != nil {
		fmt.Println("Error saving Fat Oil and Grease:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not save Fat Oil and Grease"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Fat Oil and Grease created successfully", // แก้ข้อความตรงนี้
		"data":    environmentRecord,
	})
}

func GetfirstFOG(c *gin.Context) {
	db := config.DB()

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "Fat Oil and Grease").First(&parameter).Error; err != nil {
		fmt.Println("Error fetching parameter:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	// โครงสร้างสำหรับจัดเก็บข้อมูลผลลัพธ์
	var last_fog struct {
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
		Scan(&last_fog)

	// จัดการกรณีที่เกิดข้อผิดพลาด
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	// ส่งข้อมูลกลับในรูปแบบ JSON
	c.JSON(http.StatusOK, last_fog)
}
