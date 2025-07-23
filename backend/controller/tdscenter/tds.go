package tdscenter

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

func CreateTDS(c *gin.Context) {
	var rawData map[string]interface{}
	if err := c.ShouldBindJSON(&rawData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	dateStr := rawData["Date"].(string)
	dateParsed, err := time.Parse(time.RFC3339, dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
		return
	}

	standardID := uint(rawData["StandardID"].(float64))
	employeeID := uint(rawData["EmployeeID"].(float64))
	note := ""
	if rawData["Note"] != nil {
		note = rawData["Note"].(string)
	}
	beforeAfterID := int(rawData["BeforeAfterTreatmentID"].(float64))

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
	if err := db.Where("parameter_name = ?", "Total Dissolved Solids").First(&parameter).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	var environment entity.Environment
	if err := db.Where("environment_name = ?", "น้ำเสีย").First(&environment).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid environment"})
		return
	}

	var standard entity.Standard
	if err := db.First(&standard, standardID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบข้อมูลเกณฑ์มาตรฐาน"})
		return
	}

	// ===== FUNCTION หา StatusID ตามค่ามาตรฐาน =====
	getStatusID := func(value float64) uint {
		var status entity.Status
		if standard.MiddleValue != 0 {
			if value < float64(standard.MiddleValue) {
				db.Where("status_name = ?", "ตํ่ากว่าเกณฑ์มาตรฐาน").First(&status)
			} else if value == float64(standard.MiddleValue) {
				db.Where("status_name = ?", "อยู่ในเกณฑ์มาตรฐาน").First(&status)
			} else {
				db.Where("status_name = ?", "เกินเกณฑ์มาตรฐาน").First(&status)
			}
		} else {
			if value < float64(standard.MinValue) {
				db.Where("status_name = ?", "ตํ่ากว่าเกณฑ์มาตรฐาน").First(&status)
			} else if value > float64(standard.MaxValue) {
				db.Where("status_name = ?", "เกินเกณฑ์มาตรฐาน").First(&status)
			} else {
				db.Where("status_name = ?", "อยู่ในเกณฑ์มาตรฐาน").First(&status)
			}
		}
		return status.ID
	}

	if beforeAfterID == 3 {
		// แยก record ก่อนและหลัง
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
			StatusID:               getStatusID(valueBefore), // ✅ เพิ่ม Status
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
			StatusID:               getStatusID(valueAfter), // ✅ เพิ่ม Status
		}

		if err := db.Create(&recordBefore).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if err := db.Create(&recordAfter).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "บันทึกข้อมูล TDS ก่อนและหลังบำบัดสำเร็จ",
			"before":  recordBefore,
			"after":   recordAfter,
		})
		return
	}

	// กรณีทั่วไป (Before หรือ After อย่างเดียว)
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
		StatusID:               getStatusID(data), // ✅ เพิ่ม Status
	}

	if err := db.Create(&record).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "บันทึกข้อมูล TDS สำเร็จ",
		"data":    record,
	})
}

func GetTDS(c *gin.Context) {
	var tds []entity.EnvironmentalRecord

	db := config.DB()

	result := db.Preload("BeforeAfterTreatment").
		Preload("Environment").
		Preload("Parameter").
		Preload("Standard").
		Preload("Unit").
		Preload("Employee").
		Preload("Status").
		Find(&tds)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, tds)
}

func GetTDSbyID(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var tds struct {
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
			environmental_records.before_after_treatment_id, environmental_records.environment_id, environmental_records.parameter_id,
			environmental_records.standard_id, environmental_records.unit_id, environmental_records.employee_id,
			standards.min_value, standards.middle_value, standards.max_value`).
		Joins("inner join standards on environmental_records.standard_id = standards.id").
		Where("environmental_records.id = ?", id).
		Scan(&tds)

	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
		return
	}

	c.JSON(http.StatusOK, tds)
}

func UpdateTDS(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var rawData map[string]interface{}
	if err := c.ShouldBindJSON(&rawData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	// ===== ดึง record เดิม =====
	var existingRecord entity.EnvironmentalRecord
	if err := db.First(&existingRecord, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลที่ต้องการแก้ไข"})
		return
	}

	// ===== แปลงค่า =====
	dateStr := rawData["Date"].(string)
	dateParsed, err := time.Parse(time.RFC3339, dateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
		return
	}

	data := rawData["Data"].(float64)
	standardID := uint(rawData["StandardID"].(float64))
	employeeID := uint(rawData["EmployeeID"].(float64))
	note := ""
	if rawData["Note"] != nil {
		note = rawData["Note"].(string)
	}
	beforeAfterID := int(rawData["BeforeAfterTreatmentID"].(float64))

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
			if err := db.Create(&newUnit).Error; err == nil {
				unitID = newUnit.ID
			}
		}
	}

	var standard entity.Standard
	if err := db.First(&standard, standardID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบข้อมูลเกณฑ์มาตรฐาน"})
		return
	}

	// ===== หา Status ตามมาตรฐาน =====
	getStatusID := func(value float64) uint {
		var status entity.Status
		if standard.MiddleValue != 0 {
			if value < float64(standard.MiddleValue) {
				db.Where("status_name = ?", "ตํ่ากว่าเกณฑ์มาตรฐาน").First(&status)
			} else if value == float64(standard.MiddleValue) {
				db.Where("status_name = ?", "อยู่ในเกณฑ์มาตรฐาน").First(&status)
			} else {
				db.Where("status_name = ?", "เกินเกณฑ์มาตรฐาน").First(&status)
			}
		} else {
			if value < float64(standard.MinValue) {
				db.Where("status_name = ?", "ตํ่ากว่าเกณฑ์มาตรฐาน").First(&status)
			} else if value > float64(standard.MaxValue) {
				db.Where("status_name = ?", "เกินเกณฑ์มาตรฐาน").First(&status)
			} else {
				db.Where("status_name = ?", "อยู่ในเกณฑ์มาตรฐาน").First(&status)
			}
		}
		return status.ID
	}

	// ===== อัปเดตข้อมูล =====
	updatedData := map[string]interface{}{
		"Date":                   dateParsed,
		"Data":                   data,
		"BeforeAfterTreatmentID": beforeAfterID,
		"StandardID":             standardID,
		"UnitID":                 unitID,
		"EmployeeID":             employeeID,
		"Note":                   note,
		"StatusID":               getStatusID(data),
	}

	if err := db.Model(&existingRecord).Updates(updatedData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดตข้อมูลได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "อัปเดตข้อมูล TDS สำเร็จ",
		"data":    existingRecord,
	})
}

func DeleteTDS(c *gin.Context) {
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

	c.JSON(http.StatusOK, gin.H{"message": "ลบข้อมูล TDS สำเร็จ"})
}

func GetfirstTDS(c *gin.Context) {
	db := config.DB()

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "Total Dissolved Solids").First(&parameter).Error; err != nil {
		fmt.Println("Error fetching parameter:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	// โครงสร้างสำหรับจัดเก็บข้อมูลผลลัพธ์
	var firsttds struct {
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
		Scan(&firsttds)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, firsttds)
}
