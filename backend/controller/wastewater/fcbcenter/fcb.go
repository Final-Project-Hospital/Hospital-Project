package fcbcenter

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

func CreateFCB(c *gin.Context) {
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
	if err := db.Where("parameter_name = ?","Fecal Coliform Bacteria").First(&parameter).Error; err != nil {
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

	fcb := entity.EnvironmentalRecord{
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

	if err := db.Create(&fcb).Error; err != nil {
		fmt.Println("Error saving Fecal Coliform Bacteria:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not save Fecal Coliform Bacteria"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "บันทึกข้อมูล FCB สำเร็จ", 
		"data": fcb})
}

func GetFCB(c *gin.Context) {
	db := config.DB()

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "Fecal Coliform Bacteria").First(&parameter).Error; err != nil {
		fmt.Println("Error fetching parameter:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}
	var before entity.BeforeAfterTreatment
	if err := db.Where("treatment_name = ?", "ก่อน").First(&before).Error; err != nil {
		fmt.Println("Error fetching parameter:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	// โครงสร้างสำหรับจัดเก็บข้อมูลผลลัพธ์
	var fcb []struct {
		ID                     	uint      `json:"ID"`
		Date                   	time.Time `json:"Date"`
		// FormattedDate          string    `json:"Date"`
		Data                   	float64   `json:"Data"`
		Note                   	string    `json:"Note"`
		BeforeAfterTreatmentID 	uint      `json:"BeforeAfterTreatmentID"`
		EnvironmentID          	uint      `json:"EnvironmentID"`
		ParameterID            	uint      `json:"ParameterID"`
		StandardID             	uint      `json:"StandardID"`
		UnitID                 	uint      `json:"UnitID"`
		EmployeeID             	uint      `json:"EmployeeID"`
		MinValue               	uint      `json:"MinValue"`
		MiddleValue            	uint      `json:"MiddleValue"`
		MaxValue               	uint      `json:"MaxValue"`
		UnitName               	string
		TreatmentName          	string
		StatusName				string
	}
	result := db.Model(&entity.EnvironmentalRecord{}).
		Select(`environmental_records.id, environmental_records.date,environmental_records.data,environmental_records.note,environmental_records.before_after_treatment_id,environmental_records.environment_id ,environmental_records.parameter_id 
		,environmental_records.standard_id ,environmental_records.unit_id ,environmental_records.employee_id,units.unit_name,before_after_treatments.treatment_name,standards.min_value,standards.middle_value,standards.max_value,statuses.status_name`).
		Joins("inner join standards on environmental_records.standard_id = standards.id").
		Joins("inner join units on environmental_records.unit_id = units.id").
		Joins("inner join before_after_treatments on environmental_records.before_after_treatment_id = before_after_treatments.id").
		Joins("inner join statuses on environmental_records.status_id = statuses.id").
		Where("environmental_records.parameter_id = ? ", parameter.ID).
		// Where("environmental_records.parameter_id = ? AND environmental_records.before_after_treatment_id = ? ", parameter.ID, before.ID).
		// Order("environmental_records.created_at desc").
		Find(&fcb)

	// จัดการกรณีที่เกิดข้อผิดพลาด
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, fcb)
}
func GetFirstFCB(c *gin.Context) {
	db := config.DB()

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "Fecal Coliform Bacteria").First(&parameter).Error; err != nil {
		fmt.Println("Parameter not found:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parameter FCB not found"})
		return
	}

	// โครงสร้างสำหรับจัดเก็บข้อมูลผลลัพธ์ล่าสุดของ TKN
	var firstFCB struct {
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
		Scan(&firstFCB)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, firstFCB)
}

var thaiMonths = [...]string{
	"ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
	"ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
}

func formatThaiDate(t time.Time) string {
	day := t.Day()
	month := thaiMonths[t.Month()-1]
	year := t.Year() + 543 // พ.ศ.
	return strconv.Itoa(day) + " " + month + " " + strconv.Itoa(year)
}

func GetFCBbyID(c *gin.Context) {

	id := c.Param("id")

	var fcb struct {
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

	db := config.DB()

	result := db.Model(&entity.EnvironmentalRecord{}).
		Select(`environmental_records.id, environmental_records.date, environmental_records.data, environmental_records.note,
			environmental_records.before_after_treatment_id, environmental_records.environment_id, environmental_records.parameter_id,
			environmental_records.standard_id, environmental_records.unit_id, environmental_records.employee_id,
			standards.min_value, standards.middle_value, standards.max_value`).
		Joins("inner join standards on environmental_records.standard_id = standards.id").
		Where("environmental_records.id = ?", id).
		Scan(&fcb)

	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
		return
	}

	c.JSON(http.StatusOK, fcb)
}
func GetFCBTABLE(c *gin.Context) {
	db := config.DB()

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "Fecal Coliform Bacteria").First(&parameter).Error; err != nil {
		fmt.Println("Parameter not found:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parameter FCB not found"})
		return
	} 

	var fcb []entity.EnvironmentalRecord
		result := db.Preload("BeforeAfterTreatment").
		Preload("Environment").
		Preload("Unit").
		Preload("Employee").
		Where("parameter_id = ?", parameter.ID).
		Find(&fcb)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	type keyType struct {
		Date          string
		EnvironmentID uint
	}
	type FCBRecord struct {
		Date          string   `json:"date"`
		Unit          string   `json:"unit"`
		StandardValue string   `json:"standard_value"`
		BeforeValue   *float64 `json:"before_value,omitempty"`
		AfterValue    *float64 `json:"after_value,omitempty"`
		BeforeID      *uint    `json:"before_id,omitempty"`
		AfterID       *uint    `json:"after_id,omitempty"`
		BeforeNote    string   `json:"before_note,omitempty"`
		AfterNote     string   `json:"after_note,omitempty"`
		Efficiency    *float64 `json:"efficiency,omitempty"`
		Status        string   `json:"status"`
	}

	fcbMap := make(map[keyType]*FCBRecord)

	for _, rec := range fcb {
		dateStr := rec.Date.Format("2006-01-02")
		k := keyType{
			Date: 				dateStr,
			EnvironmentID: 		rec.EnvironmentID,
		}

		var latestRec entity.EnvironmentalRecord
		err := db.
			Joins("JOIN parameters p ON p.id = environmental_records.parameter_id").
			Where("p.parameter_name = ?", "Fecal Coliform Bacteria").
			Where("DATE(environmental_records.date) = ?", dateStr).
			Order("environmental_records.date DESC").
			First(&latestRec).Error

		stdVal := "-"
		if err == nil && latestRec.StandardID != 0 {
			var std entity.Standard
			if db.First(&std, latestRec.StandardID).Error == nil {
				if (std.MinValue != 0 || std.MaxValue != 0) && (std.MinValue < std.MaxValue) {
					stdVal = fmt.Sprintf("%.2f - %.2f", std.MinValue, std.MaxValue)
				} else if std.MiddleValue > 0 {
					stdVal = fmt.Sprintf("%.2f", std.MiddleValue)
				}
			}
		}

		if _, exists := fcbMap[k]; !exists {
			fcbMap[k] = &FCBRecord{
				Date:          dateStr,
				Unit:          rec.Unit.UnitName,
				StandardValue: stdVal,
			}
		}

		val := rec.Data
		if rec.BeforeAfterTreatmentID == 1 {
			fcbMap[k].BeforeValue = &val
			fcbMap[k].BeforeID = &rec.ID
		} else if rec.BeforeAfterTreatmentID == 2 {
			fcbMap[k].AfterValue = &val
			fcbMap[k].AfterID = &rec.ID
		}

		if fcbMap[k].BeforeValue != nil && fcbMap[k].AfterValue != nil && *fcbMap[k].BeforeValue != 0 {
			eff := ((*fcbMap[k].BeforeValue - *fcbMap[k].AfterValue) / (*fcbMap[k].BeforeValue ))* 100
			// ✅ ถ้าค่าติดลบให้กลายเป็น 0.00
			//fmt.Printf("Efficiency2: %.2f\n", eff)
			if eff < 0 {
				eff = 0.00
			}
			fcbMap[k].Efficiency = &eff
		}

				// Status
		if fcbMap[k].AfterValue != nil && latestRec.StandardID != 0 {
			var std entity.Standard
			if db.First(&std, latestRec.StandardID).Error == nil {
				after := *fcbMap[k].AfterValue
				if std.MinValue != 0 || std.MaxValue != 0 {
					if after < float64(std.MinValue) {
						fcbMap[k].Status = "ต่ำกว่าเกณฑ์มาตรฐาน"
					} else if after > float64(std.MaxValue) {
						fcbMap[k].Status = "เกินเกณฑ์มาตรฐาน"
					} else {
						fcbMap[k].Status = "อยู่ในเกณฑ์มาตรฐาน"
					}
				} else {
					if after > float64(std.MiddleValue) {
						fcbMap[k].Status = "เกินเกณฑ์มาตรฐาน"
					} else {
						fcbMap[k].Status = "อยู่ในเกณฑ์มาตรฐาน"
					}
				}
			}
		}
	}

	// สร้าง map รวบรวม id -> note เพื่อดึง note ของ before และ after จากข้อมูลดิบ
	noteMap := make(map[uint]string)
	for _, rec := range fcb {
		noteMap[rec.ID] = rec.Note
	}

	// เติม BeforeNote และ AfterNote ใน tdsMap
	for _, val := range fcbMap {
		if val.BeforeID != nil {
			if note, ok := noteMap[*val.BeforeID]; ok {
				val.BeforeNote = note
			}
		}
		if val.AfterID != nil {
			if note, ok := noteMap[*val.AfterID]; ok {
				val.AfterNote = note
			}
		}
	}

	// รวมข้อมูลส่งกลับ
	var mergedRecords []FCBRecord
	for _, val := range fcbMap {
		mergedRecords = append(mergedRecords, *val)
	}

	c.JSON(http.StatusOK, mergedRecords)

}
func UpdateFCB(c *gin.Context) {
	var fcb entity.EnvironmentalRecord
	id := c.Param("id")
	uintID, err := strconv.ParseUint(id, 10, 32)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID ไม่ถูกต้อง"})
		return
	}

	db := config.DB()

	if err := db.First(&fcb, uint(uintID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูล"})
		return
	}

	var input entity.EnvironmentalRecord
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fcb.Date = input.Date
	fcb.Data = input.Data
	fcb.BeforeAfterTreatmentID = input.BeforeAfterTreatmentID
	fcb.EnvironmentID = input.EnvironmentID
	fcb.ParameterID = input.ParameterID
	fcb.StandardID = input.StandardID
	fcb.UnitID = input.UnitID
	fcb.EmployeeID = input.EmployeeID

	if err := db.Save(&fcb).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "อัปเดตข้อมูลสำเร็จ", "data": fcb})
}

func DeleteFCB(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	// Update `deleted_at` field to mark as deleted (using current timestamp)
	if tx := db.Exec("UPDATE environmental_records SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found or already deleted"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Soft Deleted Environmental Records Successfully"})
}
