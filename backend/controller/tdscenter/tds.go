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
			// กรณีเกณฑ์เป็นค่าเดียว (MiddleValue)
			if value < float64(standard.MiddleValue) {
				// ถ้าค่าต่ำกว่าเกณฑ์ จะเปลี่ยนเป็น "อยู่ในเกณฑ์มาตรฐาน" ตามที่ขอ
				db.Where("status_name = ?", "อยู่ในเกณฑ์มาตรฐาน").First(&status)
			} else if value == float64(standard.MiddleValue) {
				db.Where("status_name = ?", "อยู่ในเกณฑ์มาตรฐาน").First(&status)
			} else {
				db.Where("status_name = ?", "เกินเกณฑ์มาตรฐาน").First(&status)
			}
		} else {
			// กรณีเกณฑ์เป็นช่วง (MinValue, MaxValue)
			if value < float64(standard.MinValue) {
				db.Where("status_name = ?", "ต่ำกว่าเกณฑ์มาตรฐาน").First(&status)
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

// อันใหม่เเสดงวันละ record
func GetTDS(c *gin.Context) {
	db := config.DB()

	// หา ParameterID ของ "Total Dissolved Solids"
	var param entity.Parameter
	if err := db.Where("parameter_name = ?", "Total Dissolved Solids").First(&param).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่พบ Parameter Total Dissolved Solids"})
		return
	}

	var tds []entity.EnvironmentalRecord
	result := db.Preload("BeforeAfterTreatment").
		Preload("Environment").
		Preload("Unit").
		Preload("Employee").
		Where("parameter_id = ?", param.ID).
		Find(&tds)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	type keyType struct {
		Date          string
		EnvironmentID uint
	}

	type TDSRecord struct {
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

	tdsMap := make(map[keyType]*TDSRecord)

	for _, rec := range tds {
		dateStr := rec.Date.Format("2006-01-02")
		k := keyType{
			Date:          dateStr,
			EnvironmentID: rec.EnvironmentID,
		}

		// หา EnvironmentalRecord ล่าสุดของวันนั้น (เพื่อดึง standard + unit)
		var latestRec entity.EnvironmentalRecord
		err := db.
			Joins("JOIN parameters p ON p.id = environmental_records.parameter_id").
			Where("p.parameter_name = ?", "Total Dissolved Solids").
			Where("DATE(environmental_records.date) = ?", dateStr).
			Order("environmental_records.date DESC").
			First(&latestRec).Error

		stdVal := "-"
		unitName := rec.Unit.UnitName // default
		if err == nil && latestRec.ID != 0 {
			// ✅ ใช้ unit ของ record ล่าสุด
			var latestUnit entity.Unit
			if db.First(&latestUnit, latestRec.UnitID).Error == nil {
				unitName = latestUnit.UnitName
			}

			if latestRec.StandardID != 0 {
				var std entity.Standard
				if db.First(&std, latestRec.StandardID).Error == nil {
					if (std.MinValue != 0 || std.MaxValue != 0) && (std.MinValue < std.MaxValue) {
						stdVal = fmt.Sprintf("%.2f - %.2f", std.MinValue, std.MaxValue)
					} else if std.MiddleValue > 0 {
						stdVal = fmt.Sprintf("%.2f", std.MiddleValue)
					}
				}
			}
		}

		if _, exists := tdsMap[k]; !exists {
			tdsMap[k] = &TDSRecord{
				Date:          dateStr,
				Unit:          unitName,
				StandardValue: stdVal,
			}
		}

		// Before / After
		val := rec.Data
		if rec.BeforeAfterTreatmentID == 1 {
			tdsMap[k].BeforeValue = &val
			tdsMap[k].BeforeID = &rec.ID
		} else if rec.BeforeAfterTreatmentID == 2 {
			tdsMap[k].AfterValue = &val
			tdsMap[k].AfterID = &rec.ID
		}

		// Efficiency
		if tdsMap[k].BeforeValue != nil && tdsMap[k].AfterValue != nil && *tdsMap[k].BeforeValue != 0 {
			eff := (*tdsMap[k].BeforeValue - *tdsMap[k].AfterValue) / (*tdsMap[k].BeforeValue * 100)
			if eff < 0 {
				eff = 0.00
			}
			tdsMap[k].Efficiency = &eff
		}

		// Status
		if tdsMap[k].AfterValue != nil && latestRec.StandardID != 0 {
			var std entity.Standard
			if db.First(&std, latestRec.StandardID).Error == nil {
				after := *tdsMap[k].AfterValue
				if std.MinValue != 0 || std.MaxValue != 0 {
					if after < float64(std.MinValue) {
						tdsMap[k].Status = "ต่ำกว่าเกณฑ์มาตรฐาน"
					} else if after > float64(std.MaxValue) {
						tdsMap[k].Status = "เกินเกณฑ์มาตรฐาน"
					} else {
						tdsMap[k].Status = "อยู่ในเกณฑ์มาตรฐาน"
					}
				} else {
					if after > float64(std.MiddleValue) {
						tdsMap[k].Status = "เกินเกณฑ์มาตรฐาน"
					} else {
						tdsMap[k].Status = "อยู่ในเกณฑ์มาตรฐาน"
					}
				}
			}
		}
	}

	// สร้าง map รวบรวม id -> note เพื่อดึง note ของ before และ after จากข้อมูลดิบ
	noteMap := make(map[uint]string)
	for _, rec := range tds {
		noteMap[rec.ID] = rec.Note
	}

	// เติม BeforeNote และ AfterNote ใน tdsMap
	for _, val := range tdsMap {
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
	var mergedRecords []TDSRecord
	for _, val := range tdsMap {
		mergedRecords = append(mergedRecords, *val)
	}

	c.JSON(http.StatusOK, mergedRecords)
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
		Scan(&tds)

	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
		return
	}

	c.JSON(http.StatusOK, tds)
}

func UpdateOrCreateTDS(c *gin.Context) {
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
		mid := float64(standard.MiddleValue)
		min := float64(standard.MinValue)
		max := float64(standard.MaxValue)

		if standard.MiddleValue != 0 {
			if value < mid {
				db.Where("status_name = ?", "ต่ำกว่าเกณฑ์มาตรฐาน").First(&status)
			} else if value == mid {
				db.Where("status_name = ?", "อยู่ในเกณฑ์มาตรฐาน").First(&status)
			} else {
				db.Where("status_name = ?", "เกินเกณฑ์มาตรฐาน").First(&status)
			}
		} else {
			if value < min {
				db.Where("status_name = ?", "ต่ำกว่าเกณฑ์มาตรฐาน").First(&status)
			} else if value > max {
				db.Where("status_name = ?", "เกินเกณฑ์มาตรฐาน").First(&status)
			} else {
				db.Where("status_name = ?", "อยู่ในเกณฑ์มาตรฐาน").First(&status)
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
		MinValue               float64   `json:"MinValue"`
		MiddleValue            float64   `json:"MiddleValue"`
		MaxValue               float64   `json:"MaxValue"`
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

func DeleteAllTDSRecordsByDate(c *gin.Context) {
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
		"message": "ลบข้อมูล TDS สำเร็จ",
		"date":    dateKey,
	})
}

func CheckUnit(c *gin.Context) {
	name := c.Query("name")
	var unit entity.Unit

	// ตรวจสอบในฐานข้อมูลว่ามีหรือไม่
	if err := config.DB().Where("unit_name = ?", name).First(&unit).Error; err == nil {
		c.JSON(200, gin.H{"exists": true})
		return
	}
	c.JSON(200, gin.H{"exists": false})
}

func CheckStandard(c *gin.Context) {
	standardType := c.Query("type")

	if standardType == "middle" {
		middleValue := c.Query("value")
		var std entity.Standard
		if err := config.DB().Where("middle_value = ?", middleValue).First(&std).Error; err == nil {
			c.JSON(200, gin.H{"exists": true})
			return
		}
		c.JSON(200, gin.H{"exists": false})
		return
	}

	if standardType == "range" {
		min := c.Query("min")
		max := c.Query("max")
		var std entity.Standard
		if err := config.DB().
			Where("min_value = ? AND max_value = ?", min, max).
			First(&std).Error; err == nil {
			c.JSON(200, gin.H{"exists": true})
			return
		}
		c.JSON(200, gin.H{"exists": false})
		return
	}

	c.JSON(400, gin.H{"error": "invalid type"})
}
