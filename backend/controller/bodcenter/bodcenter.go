package bodcenter

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

func CreateBod(c *gin.Context) {
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
	if err := db.Where("parameter_name = ?", "Biochemical Oxygen Demand").First(&parameter).Error; err != nil {
		fmt.Println("Error fetching parameter:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	var environment entity.Environment
	if err := db.Where("environment_name = ?", "น้ำเสีย").First(&environment).Error; err != nil {
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
				db.Where("status_name = ?", "ต่ำกว่าเกณฑ์มาตรฐาน").First(&status)
			}
		}
		return status.ID
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
		StatusID:               getStatusID(input.Data),
	}

	if err := db.Create(&environmentRecord).Error; err != nil {
		fmt.Println("Error saving Biochemical Oxygen Demand:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not save Biochemical Oxygen Demand"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Biochemical Oxygen Demand created successfully", // แก้ข้อความตรงนี้
		"data":    environmentRecord,
	})
}

func GetfirstBOD(c *gin.Context) {
	db := config.DB()

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "Biochemical Oxygen Demand").First(&parameter).Error; err != nil {
		fmt.Println("Error fetching parameter:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	// โครงสร้างสำหรับจัดเก็บข้อมูลผลลัพธ์
	var firstbod struct {
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
		MinValue               float64   `json:"MinValue"`
		MiddleValue            float64   `json:"MiddleValue"`
		MaxValue               float64   `json:"MaxValue"`
		UnitName               string    `json:"UnitName"`
	}

	// คำสั่ง SQL ที่แก้ไขให้ใช้ DISTINCT ใน GROUP_CONCAT
	result := db.Model(&entity.EnvironmentalRecord{}).
		Select(`environmental_records.id, environmental_records.date, environmental_records.data, environmental_records.note,environmental_records.before_after_treatment_id,environmental_records.environment_id ,environmental_records.parameter_id ,environmental_records.standard_id ,environmental_records.unit_id ,environmental_records.employee_id,standards.min_value,standards.middle_value,standards.max_value,units.unit_name`).
		Joins("inner join standards on environmental_records.standard_id = standards.id").
		Joins("inner join units on environmental_records.unit_id = units.id").
		Where("parameter_id = ?", parameter.ID).
		Order("environmental_records.created_at desc").
		Scan(&firstbod)

	// จัดการกรณีที่เกิดข้อผิดพลาด
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	// ส่งข้อมูลกลับในรูปแบบ JSON
	c.JSON(http.StatusOK, firstbod)
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

func ListBOD(c *gin.Context) {
	db := config.DB()

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "Biochemical Oxygen Demand").First(&parameter).Error; err != nil {
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
	var firstbod []struct {
		ID   uint      `json:"ID"`
		Date time.Time `json:"Date"`
		// FormattedDate          string    `json:"Date"`
		Data                   float64 `json:"Data"`
		Note                   string  `json:"Note"`
		BeforeAfterTreatmentID uint    `json:"BeforeAfterTreatmentID"`
		EnvironmentID          uint    `json:"EnvironmentID"`
		ParameterID            uint    `json:"ParameterID"`
		StandardID             uint    `json:"StandardID"`
		UnitID                 uint    `json:"UnitID"`
		EmployeeID             uint    `json:"EmployeeID"`
		MinValue               float64 `json:"MinValue"`
		MiddleValue            float64 `json:"MiddleValue"`
		MaxValue               float64 `json:"MaxValue"`
		UnitName               string
		TreatmentName          string
		StatusName             string
	}

	// คำสั่ง SQL ที่แก้ไขให้ใช้ DISTINCT ใน GROUP_CONCAT
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
		Find(&firstbod)

	// for i := range firstbod {
	// 	firstbod[i].FormattedDate = formatThaiDate(firstbod[i].Date)
	// }

	// จัดการกรณีที่เกิดข้อผิดพลาด
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	// ส่งข้อมูลกลับในรูปแบบ JSON
	c.JSON(http.StatusOK, firstbod)
}

func DeleterBOD(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	// Update `deleted_at` field to mark as deleted (using current timestamp)
	if tx := db.Exec("UPDATE environmental_records SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found or already deleted"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Soft Deleted Environmental Records Successfully"})
}

// func GetBODbyID(c *gin.Context) {
// 	id := c.Param("id")
// 	db := config.DB()

// 	var tds struct {
// 		ID                     uint      `json:"ID"`
// 		Date                   time.Time `json:"Date"`
// 		Data                   float64   `json:"Data"`
// 		Note                   string    `json:"Note"`
// 		BeforeAfterTreatmentID uint      `json:"BeforeAfterTreatmentID"`
// 		EnvironmentID          uint      `json:"EnvironmentID"`
// 		ParameterID            uint      `json:"ParameterID"`
// 		StandardID             uint      `json:"StandardID"`
// 		UnitID                 uint      `json:"UnitID"`
// 		EmployeeID             uint      `json:"EmployeeID"`
// 		MinValue               float64   `json:"MinValue"`
// 		MiddleValue            float64   `json:"MiddleValue"`
// 		MaxValue               float64   `json:"MaxValue"`
// 	}

// 	result := db.Model(&entity.EnvironmentalRecord{}).
// 		Select(`environmental_records.id, environmental_records.date, environmental_records.data, environmental_records.note,
// 			environmental_records.before_after_treatment_id, environmental_records.environment_id, environmental_records.parameter_id,
// 			environmental_records.standard_id, environmental_records.unit_id, environmental_records.employee_id,
// 			standards.min_value, standards.middle_value, standards.max_value`).
// 		Joins("inner join standards on environmental_records.standard_id = standards.id").
// 		Where("environmental_records.id = ?", id).
// 		Scan(&tds)

// 	if result.Error != nil || result.RowsAffected == 0 {
// 		c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
// 		return
// 	}

// 	c.JSON(http.StatusOK, tds)
// }

func GetBODTABLE(c *gin.Context) {
	db := config.DB()

	// หา ParameterID ของ "Total Dissolved Solids"
	var param entity.Parameter
	if err := db.Where("parameter_name = ?", "Biochemical Oxygen Demand").First(&param).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่พบ Parameter Total Dissolved Solids"})
		return
	}

	var bod []entity.EnvironmentalRecord
	result := db.Preload("BeforeAfterTreatment").
		Preload("Environment").
		Preload("Unit").
		Preload("Employee").
		Where("parameter_id = ?", param.ID).
		Find(&bod)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	type keyType struct {
		Date          string
		EnvironmentID uint
	}

	type BODRecord struct {
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

	bodMap := make(map[keyType]*BODRecord)

	for _, rec := range bod {
		dateStr := rec.Date.Format("2006-01-02")
		k := keyType{
			Date:          dateStr,
			EnvironmentID: rec.EnvironmentID,
		}

		// หา EnvironmentalRecord ล่าสุดของวันนั้น (เพื่อดึง standard)
		var latestRec entity.EnvironmentalRecord
		err := db.
			Joins("JOIN parameters p ON p.id = environmental_records.parameter_id").
			Where("p.parameter_name = ?", "Biochemical Oxygen Demand").
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

		if _, exists := bodMap[k]; !exists {
			bodMap[k] = &BODRecord{
				Date:          dateStr,
				Unit:          rec.Unit.UnitName,
				StandardValue: stdVal,
			}
		}

		// Before / After
		val := rec.Data
		if rec.BeforeAfterTreatmentID == 1 {
			bodMap[k].BeforeValue = &val
			bodMap[k].BeforeID = &rec.ID
		} else if rec.BeforeAfterTreatmentID == 2 {
			bodMap[k].AfterValue = &val
			bodMap[k].AfterID = &rec.ID
		}

		// Efficiency
		if bodMap[k].BeforeValue != nil && bodMap[k].AfterValue != nil && *bodMap[k].BeforeValue != 0 {
			eff := ((*bodMap[k].BeforeValue - *bodMap[k].AfterValue) / (*bodMap[k].BeforeValue ))* 100
			// ✅ ถ้าค่าติดลบให้กลายเป็น 0.00
			//fmt.Printf("Efficiency2: %.2f\n", eff)
			if eff < 0 {
				eff = 0.00
			}
			bodMap[k].Efficiency = &eff
		}

		// Status
		if bodMap[k].AfterValue != nil && latestRec.StandardID != 0 {
			var std entity.Standard
			if db.First(&std, latestRec.StandardID).Error == nil {
				after := *bodMap[k].AfterValue
				if std.MinValue != 0 || std.MaxValue != 0 {
					if after < float64(std.MinValue) {
						bodMap[k].Status = "ต่ำกว่าเกณฑ์มาตรฐาน"
					} else if after > float64(std.MaxValue) {
						bodMap[k].Status = "เกินเกณฑ์มาตรฐาน"
					} else {
						bodMap[k].Status = "อยู่ในเกณฑ์มาตรฐาน"
					}
				} else {
					if after > float64(std.MiddleValue) {
						bodMap[k].Status = "เกินเกณฑ์มาตรฐาน"
					} else {
						bodMap[k].Status = "อยู่ในเกณฑ์มาตรฐาน"
					}
				}
			}
		}
	}

	// สร้าง map รวบรวม id -> note เพื่อดึง note ของ before และ after จากข้อมูลดิบ
	noteMap := make(map[uint]string)
	for _, rec := range bod {
		noteMap[rec.ID] = rec.Note
	}

	// เติม BeforeNote และ AfterNote ใน bodMap
	for _, val := range bodMap {
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
	var mergedRecords []BODRecord
	for _, val := range bodMap {
		mergedRecords = append(mergedRecords, *val)
	}

	c.JSON(http.StatusOK, mergedRecords)
}

// func GetBODTABLE(c *gin.Context) {
// 	db := config.DB()

// 	// หา ParameterID ของ "Total Dissolved Solids"
// 	var param entity.Parameter
// 	if err := db.Where("parameter_name = ?", "Biochemical Oxygen Demand").First(&param).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่พบ Parameter Total Dissolved Solids"})
// 		return
// 	}

// 	var tds []entity.EnvironmentalRecord
// 	result := db.Preload("BeforeAfterTreatment").
// 		Preload("Environment").
// 		Preload("Unit").
// 		Preload("Employee").
// 		Preload("Status"). // ✅ preload Status struct เพิ่ม
// 		Where("parameter_id = ?", param.ID).
// 		Find(&tds)

// 	if result.Error != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
// 		return
// 	}

// 	type keyType struct {
// 		Date          string
// 		EnvironmentID uint
// 	}

// 	type TDSRecord struct {
// 		Date          string   `json:"date"`
// 		Unit          string   `json:"unit"`
// 		StandardValue string   `json:"standard_value"`
// 		BeforeValue   *float64 `json:"before_value,omitempty"`
// 		AfterValue    *float64 `json:"after_value,omitempty"`
// 		BeforeID      *uint    `json:"before_id,omitempty"`
// 		AfterID       *uint    `json:"after_id,omitempty"`
// 		BeforeNote    string   `json:"before_note,omitempty"`
// 		AfterNote     string   `json:"after_note,omitempty"`
// 		Efficiency    *float64 `json:"efficiency,omitempty"`
// 		Status        string   `json:"status,omitempty"` // ✅ ยังเป็น string
// 	}

// 	tdsMap := make(map[keyType]*TDSRecord)

// 	for _, rec := range tds {
// 		dateStr := rec.Date.Format("2006-01-02")
// 		k := keyType{
// 			Date:          dateStr,
// 			EnvironmentID: rec.EnvironmentID,
// 		}

// 		// หา EnvironmentalRecord ล่าสุดของวันนั้น (เพื่อดึง standard)
// 		var latestRec entity.EnvironmentalRecord
// 		err := db.
// 			Joins("JOIN parameters p ON p.id = environmental_records.parameter_id").
// 			Where("p.parameter_name = ?", "Biochemical Oxygen Demand").
// 			Where("DATE(environmental_records.date) = ?", dateStr).
// 			Order("environmental_records.date DESC").
// 			First(&latestRec).Error

// 		stdVal := "-"
// 		if err == nil && latestRec.StandardID != 0 {
// 			var std entity.Standard
// 			if db.First(&std, latestRec.StandardID).Error == nil {
// 				if (std.MinValue != 0 || std.MaxValue != 0) && (std.MinValue < std.MaxValue) {
// 					stdVal = fmt.Sprintf("%.2f - %.2f", std.MinValue, std.MaxValue)
// 				} else if std.MiddleValue > 0 {
// 					stdVal = fmt.Sprintf("%.2f", std.MiddleValue)
// 				}
// 			}
// 		}

// 		if _, exists := tdsMap[k]; !exists {
// 			tdsMap[k] = &TDSRecord{
// 				Date:          dateStr,
// 				Unit:          rec.Unit.UnitName,
// 				StandardValue: stdVal,
// 			}
// 		}

// 		val := rec.Data
// 		if rec.BeforeAfterTreatmentID == 1 {
// 			tdsMap[k].BeforeValue = &val
// 			tdsMap[k].BeforeID = &rec.ID
// 		} else if rec.BeforeAfterTreatmentID == 2 {
// 			tdsMap[k].AfterValue = &val
// 			tdsMap[k].AfterID = &rec.ID
// 		}

// 		// Efficiency calculation
// 		if tdsMap[k].BeforeValue != nil && tdsMap[k].AfterValue != nil && *tdsMap[k].BeforeValue != 0 {
// 			eff := ((*tdsMap[k].BeforeValue - *tdsMap[k].AfterValue) / (*tdsMap[k].BeforeValue)) *100
// 			if eff < 0 {
// 				eff = 0.00
// 			}
// 			tdsMap[k].Efficiency = &eff
// 		}

// 		// ✅ ใช้ status จากฐานข้อมูล (ถ้ามี after หรือ both)
// if rec.BeforeAfterTreatmentID == 2 {
// 	// สำหรับค่าหลัง ให้เซ็ต Status ของหลัง
// 	if rec.Status != nil {
// 		tdsMap[k].Status = rec.Status.StatusName
// 	}
// } else if rec.BeforeAfterTreatmentID == 1 && tdsMap[k].Status == "" && tdsMap[k].AfterValue != nil {
// 	// สำหรับค่าก่อน ให้เซ็ต Status ของหลัง ถ้ายังไม่มี Status
// 	if rec.Status != nil {
// 		tdsMap[k].Status = rec.Status.StatusName
// 	}
// }

// 	}

// 	// สร้าง noteMap สำหรับเก็บ note ของแต่ละ ID
// 	noteMap := make(map[uint]string)
// 	for _, rec := range tds {
// 		noteMap[rec.ID] = rec.Note
// 	}

// 	// เติม Note
// 	for _, val := range tdsMap {
// 		if val.BeforeID != nil {
// 			if note, ok := noteMap[*val.BeforeID]; ok {
// 				val.BeforeNote = note
// 			}
// 		}
// 		if val.AfterID != nil {
// 			if note, ok := noteMap[*val.AfterID]; ok {
// 				val.AfterNote = note
// 			}
// 		}
// 	}

// 	// แปลง map เป็น slice
// 	var mergedRecords []TDSRecord
// 	for _, val := range tdsMap {
// 		mergedRecords = append(mergedRecords, *val)
// 	}

// 	c.JSON(http.StatusOK, mergedRecords)
// }

func UpdateOrCreateBOD(c *gin.Context) {
	var input struct {
		entity.EnvironmentalRecord
		CustomStandard *struct {
			Type  string   `json:"type"`
			Value *float64 `json:"value,omitempty"`
			Min   *float64 `json:"min,omitempty"`
			Max   *float64 `json:"max,omitempty"`
		} `json:"CustomStandard,omitempty"`
		CustomUnit *string `json:"CustomUnit,omitempty"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	// ✅ ถ้า StandardID = 0 ให้สร้างใหม่จาก CustomStandard
	if input.StandardID == 0 && input.CustomStandard != nil {
		newStandard := entity.Standard{}

		switch input.CustomStandard.Type {
		case "middle":
			if input.CustomStandard.Value != nil {
				newStandard.MiddleValue = float32(*input.CustomStandard.Value)
			}
		case "range":
			if input.CustomStandard.Min != nil {
				newStandard.MinValue = float32(*input.CustomStandard.Min)
			}
			if input.CustomStandard.Max != nil {
				newStandard.MaxValue = float32(*input.CustomStandard.Max)
			}
		}

		if err := db.Create(&newStandard).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้าง Standard ได้"})
			return
		}

		input.StandardID = newStandard.ID
	}

	// ✅ โหลด Standard ที่จะใช้
	var standard entity.Standard
	if err := db.First(&standard, input.StandardID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบข้อมูลเกณฑ์มาตรฐาน"})
		return
	}

	// ✅ ฟังก์ชันคำนวณสถานะ
	getStatusID := func(value float64) uint {
		var status entity.Status

		// กรณีใช้เกณฑ์กลาง (MiddleValue)
		if standard.MiddleValue != 0 {
			if value <= float64(standard.MiddleValue) {
				// ค่าเท่ากับหรือต่ำกว่ากลาง → อยู่ในเกณฑ์
				db.Where("status_name = ?", "อยู่ในเกณฑ์มาตรฐาน").First(&status)
			} else {
				// ค่าเกิน → เกินเกณฑ์
				db.Where("status_name = ?", "เกินเกณฑ์มาตรฐาน").First(&status)
			}

			// กรณีใช้ช่วง (MinValue/MaxValue)
		} else {
			if value >= float64(standard.MinValue) && value <= float64(standard.MaxValue) {
				db.Where("status_name = ?", "อยู่ในเกณฑ์มาตรฐาน").First(&status)
			} else if value > float64(standard.MaxValue) {
				db.Where("status_name = ?", "เกินเกณฑ์มาตรฐาน").First(&status)
			} else {
				db.Where("status_name = ?", "ต่ำกว่าเกณฑ์มาตรฐาน").First(&status)
			}
		}

		return status.ID
	}

	// ✅ เช็ก CustomUnit → บันทึกถ้ายังไม่มี
	if input.CustomUnit != nil && *input.CustomUnit != "" {
		var unit entity.Unit
		if err := db.Where("unit_name = ?", *input.CustomUnit).First(&unit).Error; err == nil {
			input.UnitID = unit.ID
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			newUnit := entity.Unit{UnitName: *input.CustomUnit}
			if err := db.Create(&newUnit).Error; err == nil {
				input.UnitID = newUnit.ID
			}
		}
	}

	// ✅ Update หรือ Create
	if input.ID != 0 {
		// Update
		var existing entity.EnvironmentalRecord
		if err := db.First(&existing, input.ID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูล"})
			return
		}

		updatedData := map[string]interface{}{
			"Date":                   input.Date,
			"Data":                   input.Data,
			"BeforeAfterTreatmentID": input.BeforeAfterTreatmentID,
			"StandardID":             input.StandardID,
			"UnitID":                 input.UnitID,
			"EmployeeID":             input.EmployeeID,
			"ParameterID":            input.ParameterID,
			"StatusID":               getStatusID(input.Data),
			"Note":                   input.Note,
		}

		if err := db.Model(&existing).Updates(updatedData).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดตข้อมูลล้มเหลว"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "อัปเดตข้อมูลสำเร็จ", "data": existing})

	} else {
		// Create
		input.StatusID = getStatusID(input.Data)
		if err := db.Create(&input.EnvironmentalRecord).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างข้อมูลล้มเหลว"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "สร้างข้อมูลใหม่สำเร็จ", "data": input})
	}
}

func DeleteBOD(c *gin.Context) {
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

	c.JSON(http.StatusOK, gin.H{"message": "ลบข้อมูล BOD สำเร็จ"})
}

func GetBODbyID(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var bod struct {
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
		MinValue               float64   `json:"MinValue"`
		MiddleValue            float64   `json:"MiddleValue"`
		MaxValue               float64   `json:"MaxValue"`
	}

	result := db.Model(&entity.EnvironmentalRecord{}).
		Select(`environmental_records.id, environmental_records.date, environmental_records.data, environmental_records.note,
			environmental_records.before_after_treatment_id, environmental_records.environment_id, environmental_records.parameter_id,
			environmental_records.standard_id, environmental_records.unit_id, environmental_records.employee_id,
			standards.min_value, standards.middle_value, standards.max_value`).
		Joins("inner join standards on environmental_records.standard_id = standards.id").
		Where("environmental_records.id = ?", id).
		Scan(&bod)

	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
		return
	}

	c.JSON(http.StatusOK, bod)
}

func DeleteAllBODRecordsByDate(c *gin.Context) {
	id := c.Param("id")
	uintID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID ไม่ถูกต้อง"})
		return
	}

	db := config.DB()

	// หา record ก่อน
	var targetRecord entity.EnvironmentalRecord
	if err := db.First(&targetRecord, uint(uintID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลที่ต้องการลบ"})
		return
	}

	// ลบทั้งหมดที่มีวันที่เดียวกัน (ใช้เฉพาะ Date ไม่เอา Time)
	dateKey := targetRecord.Date.Format("2006-01-02") // แปลงเป็น YYYY-MM-DD

	if err := db.Where("DATE(date) = ?", dateKey).Delete(&entity.EnvironmentalRecord{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "ลบข้อมูล BOD สำเร็จ",
		"date":    dateKey,
	})
}