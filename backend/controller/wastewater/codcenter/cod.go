package codcenter

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

func CreateCOD(c *gin.Context) {
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
	if err := db.Where("parameter_name = ?","Chemical Oxygen Demand").First(&parameter).Error; err != nil {
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

	cod := entity.EnvironmentalRecord{
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

	if err := db.Create(&cod).Error; err != nil {
		fmt.Println("Error saving Chemical Oxygen Demand:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not save Chemical Oxygen Demand"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "บันทึกข้อมูล COD สำเร็จ", 
		"data": cod})
}

func GetCOD(c *gin.Context) {
	db := config.DB()

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "Chemical Oxygen Demand").First(&parameter).Error; err != nil {
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
	var cod []struct {
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
		Find(&cod)

	// จัดการกรณีที่เกิดข้อผิดพลาด
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, cod)
}
func GetFirstCOD(c *gin.Context) {
	db := config.DB()

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "Chemical Oxygen Demand").First(&parameter).Error; err != nil {
		fmt.Println("Parameter not found:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parameter COD not found"})
		return
	}

	// โครงสร้างสำหรับจัดเก็บข้อมูลผลลัพธ์ล่าสุดของ TKN
	var firstCOD struct {
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
		Scan(&firstCOD)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, firstCOD)
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

func GetCODbyID(c *gin.Context) {

	id := c.Param("id")

	var cod struct {
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
		Scan(&cod)

	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
		return
	}

	c.JSON(http.StatusOK, cod)
}
func GetCODTABLE(c *gin.Context) {
	db := config.DB()

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "Chemical Oxygen Demand").First(&parameter).Error; err != nil {
		fmt.Println("Parameter not found:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parameter COD not found"})
		return
	} 

	var cod []entity.EnvironmentalRecord
		result := db.Preload("BeforeAfterTreatment").
		Preload("Environment").
		Preload("Unit").
		Preload("Employee").
		Where("parameter_id = ?", parameter.ID).
		Find(&cod)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	type keyType struct {
		Date          string
		EnvironmentID uint
	}
	type CODRecord struct {
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

	codMap := make(map[keyType]*CODRecord)

	for _, rec := range cod {
		dateStr := rec.Date.Format("2006-01-02")
		k := keyType{
			Date: 				dateStr,
			EnvironmentID: 		rec.EnvironmentID,
		}

		var latestRec entity.EnvironmentalRecord
		err := db.
			Joins("JOIN parameters p ON p.id = environmental_records.parameter_id").
			Where("p.parameter_name = ?", "Chemical Oxygen Demand").
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

		if _, exists := codMap[k]; !exists {
			codMap[k] = &CODRecord{
				Date:          dateStr,
				Unit:          rec.Unit.UnitName,
				StandardValue: stdVal,
			}
		}

		val := rec.Data
		if rec.BeforeAfterTreatmentID == 1 {
			codMap[k].BeforeValue = &val
			codMap[k].BeforeID = &rec.ID
		} else if rec.BeforeAfterTreatmentID == 2 {
			codMap[k].AfterValue = &val
			codMap[k].AfterID = &rec.ID
		}

		if codMap[k].BeforeValue != nil && codMap[k].AfterValue != nil && *codMap[k].BeforeValue != 0 {
			eff := ((*codMap[k].BeforeValue - *codMap[k].AfterValue) / (*codMap[k].BeforeValue ))* 100
			// ✅ ถ้าค่าติดลบให้กลายเป็น 0.00
			//fmt.Printf("Efficiency2: %.2f\n", eff)
			if eff < 0 {
				eff = 0.00
			}
			codMap[k].Efficiency = &eff
		}

				// Status
		if codMap[k].AfterValue != nil && latestRec.StandardID != 0 {
			var std entity.Standard
			if db.First(&std, latestRec.StandardID).Error == nil {
				after := *codMap[k].AfterValue
				if std.MinValue != 0 || std.MaxValue != 0 {
					if after < float64(std.MinValue) {
						codMap[k].Status = "ต่ำกว่าเกณฑ์มาตรฐาน"
					} else if after > float64(std.MaxValue) {
						codMap[k].Status = "เกินเกณฑ์มาตรฐาน"
					} else {
						codMap[k].Status = "อยู่ในเกณฑ์มาตรฐาน"
					}
				} else {
					if after > float64(std.MiddleValue) {
						codMap[k].Status = "เกินเกณฑ์มาตรฐาน"
					} else {
						codMap[k].Status = "อยู่ในเกณฑ์มาตรฐาน"
					}
				}
			}
		}
	}

	// สร้าง map รวบรวม id -> note เพื่อดึง note ของ before และ after จากข้อมูลดิบ
	noteMap := make(map[uint]string)
	for _, rec := range cod {
		noteMap[rec.ID] = rec.Note
	}

	// เติม BeforeNote และ AfterNote ใน tdsMap
	for _, val := range codMap {
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
	var mergedRecords []CODRecord
	for _, val := range codMap {
		mergedRecords = append(mergedRecords, *val)
	}

	c.JSON(http.StatusOK, mergedRecords)

}
func UpdateCOD(c *gin.Context) {
	var cod entity.EnvironmentalRecord
	id := c.Param("id")
	uintID, err := strconv.ParseUint(id, 10, 32)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID ไม่ถูกต้อง"})
		return
	}

	db := config.DB()

	if err := db.First(&cod, uint(uintID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูล"})
		return
	}

	var input entity.EnvironmentalRecord
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cod.Date = input.Date
	cod.Data = input.Data
	cod.BeforeAfterTreatmentID = input.BeforeAfterTreatmentID
	cod.EnvironmentID = input.EnvironmentID
	cod.ParameterID = input.ParameterID
	cod.StandardID = input.StandardID
	cod.UnitID = input.UnitID
	cod.EmployeeID = input.EmployeeID

	if err := db.Save(&cod).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "อัปเดตข้อมูลสำเร็จ", "data": cod})
}

func DeleteCOD(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	// Update `deleted_at` field to mark as deleted (using current timestamp)
	if tx := db.Exec("UPDATE environmental_records SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found or already deleted"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Soft Deleted Environmental Records Successfully"})
}
