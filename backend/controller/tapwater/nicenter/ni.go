package nicenter

import (
	"errors"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Float64TwoDecimal float64

func (f Float64TwoDecimal) MarshalJSON() ([]byte, error) {
	rounded := math.Round(float64(f)*100) / 100
	s := fmt.Sprintf("%.2f", rounded)
	return []byte(s), nil
}

func CreateNI(c *gin.Context) {
	fmt.Println("Creating Environment Record")

	var input struct {
		Data       float64   `json:"data"`
		Date       time.Time `json:"date"`
		Note       string    `json:"note"`
		StandardID uint      `json:"standardID"`
		UnitID     uint      `json:"unitID"`
		EmployeeID uint      `json:"employeeID"`
		CustomUnit string    `json:"customUnit"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		fmt.Println("Error binding JSON:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	// ตรวจสอบและสร้างหน่วยใหม่ถ้ามี CustomUnit
	if input.CustomUnit != "" {
		var existingUnit entity.Unit
		if err := db.Where("unit_name = ?", input.CustomUnit).First(&existingUnit).Error; err == nil {
			input.UnitID = existingUnit.ID
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			newUnit := entity.Unit{UnitName: input.CustomUnit}
			if err := db.Create(&newUnit).Error; err == nil {
				input.UnitID = newUnit.ID
			} else {
				fmt.Println("ไม่สามารถสร้างหน่วยใหม่ได้:", err)
			}
		} else {
			fmt.Println("เกิดข้อผิดพลาดในการตรวจสอบหน่วย:", err)
		}
	}

	// หา parameter
	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "Nitrate").First(&parameter).Error; err != nil {
		fmt.Println("Error fetching parameter:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	// หา environment
	var environment entity.Environment
	if err := db.Where("environment_name = ?", "น้ำประปา").First(&environment).Error; err != nil {
		fmt.Println("Error fetching environment:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid environment"})
		return
	}

	// หา standard
	var standard entity.Standard
	if err := db.First(&standard, input.StandardID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบข้อมูลเกณฑ์มาตรฐาน"})
		return
	}

	// ฟังก์ชันตรวจสอบสถานะ
	getStatusID := func(value float64) uint {
		var status entity.Status
		if standard.MiddleValue != -1 { // ค่าเดี่ยว
			if value > float64(standard.MiddleValue) {
				db.Where("status_name = ?", "ไม่ผ่านเกณฑ์มาตรฐาน").First(&status)
			} else {
				db.Where("status_name = ?", "ผ่านเกณฑ์มาตรฐาน").First(&status)
			}
		} else { // ค่าเป็นช่วง
			if value >= float64(standard.MinValue) && value <= float64(standard.MaxValue) {
				db.Where("status_name = ?", "ผ่านเกณฑ์มาตรฐาน").First(&status)
			} else {
				db.Where("status_name = ?", "ไม่ผ่านเกณฑ์มาตรฐาน").First(&status)
			}
		}
		return status.ID
	}

	// หา record ของวันเดียวกัน
	startOfDay := time.Date(input.Date.Year(), input.Date.Month(), input.Date.Day(), 0, 0, 0, 0, input.Date.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	if err := db.Where("date >= ? AND date < ? AND parameter_id = ? AND environment_id = ?", startOfDay, endOfDay, parameter.ID, environment.ID).
		Delete(&entity.EnvironmentalRecord{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบไม่สำเร็จ"})
		return
	}

	// สร้าง Environment Record ใหม่
	environmentRecord := entity.EnvironmentalRecord{
		Date:                   input.Date,
		Data:                   input.Data,
		Note:                   input.Note,
		BeforeAfterTreatmentID: 2, // หลัง
		EnvironmentID:          environment.ID,
		ParameterID:            parameter.ID,
		StandardID:             input.StandardID,
		UnitID:                 input.UnitID,
		EmployeeID:             input.EmployeeID,
		StatusID:               getStatusID(input.Data),
	}

	if err := db.Create(&environmentRecord).Error; err != nil {
		fmt.Println("Error saving Nitrate:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not save Nitrate"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "NI created successfully",
		"data":    environmentRecord,
	})
}

func GetfirstNI(c *gin.Context) {
	db := config.DB()

	var environment entity.Environment
	if err := db.Where("environment_name = ?", "น้ำประปา").First(&environment).Error; err != nil {
		fmt.Println("Error fetching environment:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid environment"})
		return
	}

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "Nitrate").First(&parameter).Error; err != nil {
		fmt.Println("Error fetching parameter:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	// โครงสร้างสำหรับจัดเก็บข้อมูลผลลัพธ์
	var firstni struct {
		ID                     uint              `json:"ID"`
		Date                   time.Time         `json:"Date"`
		Data                   float64           `json:"Data"`
		Note                   string            `json:"Note"`
		BeforeAfterTreatmentID uint              `json:"BeforeAfterTreatmentID"`
		EnvironmentID          uint              `json:"EnvironmentID"`
		ParameterID            uint              `json:"ParameterID"`
		StandardID             uint              `json:"StandardID"`
		UnitID                 uint              `json:"UnitID"`
		EmployeeID             uint              `json:"EmployeeID"`
		MinValue               Float64TwoDecimal `json:"MinValue"`
		MiddleValue            Float64TwoDecimal `json:"MiddleValue"`
		MaxValue               Float64TwoDecimal `json:"MaxValue"`
		UnitName               string            `json:"UnitName"`
	}

	// คำสั่ง SQL ที่แก้ไขให้ใช้ DISTINCT ใน GROUP_CONCAT
	result := db.Model(&entity.EnvironmentalRecord{}).
		Select(`environmental_records.id, environmental_records.date, environmental_records.data, environmental_records.note,environmental_records.before_after_treatment_id,environmental_records.environment_id ,environmental_records.parameter_id ,environmental_records.standard_id ,environmental_records.unit_id ,environmental_records.employee_id,standards.min_value,standards.middle_value,standards.max_value,units.unit_name`).
		Joins("inner join standards on environmental_records.standard_id = standards.id").
		Joins("inner join units on environmental_records.unit_id = units.id").
		Where("parameter_id = ? AND environmental_records.environment_id = ?", parameter.ID, environment.ID).
		Order("environmental_records.created_at desc").
		Scan(&firstni)

	// จัดการกรณีที่เกิดข้อผิดพลาด
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	// ส่งข้อมูลกลับในรูปแบบ JSON
	c.JSON(http.StatusOK, firstni)
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

func ListNI(c *gin.Context) {
	db := config.DB()

	var environment entity.Environment
	if err := db.Where("environment_name = ?", "น้ำประปา").First(&environment).Error; err != nil {
		fmt.Println("Error fetching environment:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid environment"})
		return
	}

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "Nitrate").First(&parameter).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	// โครงสร้างผลลัพธ์
	var resulni []struct {
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
		UnitName               string
		TreatmentName          string
		StatusName             string
	}

	// Query หลัก โดยใช้ subquery เพื่อหา record ล่าสุดของแต่ละวัน และแต่ละ treatment (before_after_treatment_id)
	subQuery := db.Model(&entity.EnvironmentalRecord{}).
		Select("MAX(id)").
		Where("parameter_id = ? AND environmental_records.environment_id = ?", parameter.ID, environment.ID).
		Group("DATE(date), before_after_treatment_id")

	// ดึงข้อมูลหลักโดย join กับ subQuery ข้างบน
	err := db.Model(&entity.EnvironmentalRecord{}).
		Select(`environmental_records.id, environmental_records.date, environmental_records.data, environmental_records.note, 
			environmental_records.before_after_treatment_id, environmental_records.environment_id, environmental_records.parameter_id,
			environmental_records.standard_id, environmental_records.unit_id, environmental_records.employee_id, 
			units.unit_name, before_after_treatments.treatment_name, standards.min_value, standards.middle_value, standards.max_value, statuses.status_name`).
		Joins("inner join standards on environmental_records.standard_id = standards.id").
		Joins("inner join units on environmental_records.unit_id = units.id").
		Joins("inner join before_after_treatments on environmental_records.before_after_treatment_id = before_after_treatments.id").
		Joins("inner join statuses on environmental_records.status_id = statuses.id").
		Where("environmental_records.id IN (?)", subQuery).
		Order("environmental_records.date DESC").
		Find(&resulni).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resulni)
}

func DeleterNI(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	// Update `deleted_at` field to mark as deleted (using current timestamp)
	if tx := db.Exec("UPDATE environmental_records SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found or already deleted"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Soft Deleted Environmental Records Successfully"})
}

func GetNITABLE(c *gin.Context) {
	db := config.DB()

	var environment entity.Environment
	if err := db.Where("environment_name = ?", "น้ำประปา").First(&environment).Error; err != nil {
		fmt.Println("Error fetching environment:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid environment"})
		return
	}

	// หา ParameterID ของ "Nitrate"
	var param entity.Parameter
	if err := db.Where("parameter_name = ?", "Nitrate").First(&param).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่พบ Parameter Nitrate"})
		return
	}

	var ni []entity.EnvironmentalRecord
	result := db.Preload("BeforeAfterTreatment").
		Preload("Environment").
		Preload("Unit").
		Preload("Employee").
		Where("parameter_id = ? AND environmental_records.environment_id = ?", param.ID, environment.ID).
		Order("date ASC").
		Find(&ni)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	type keyType struct {
		Date          string
		EnvironmentID uint
	}

	type NIRecord struct {
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

	niMap := make(map[keyType]*NIRecord)

	for _, rec := range ni {
		dateStr := rec.Date.Format("2006-01-02")
		k := keyType{
			Date:          dateStr,
			EnvironmentID: rec.EnvironmentID,
		}

		// หา EnvironmentalRecord ล่าสุดของวันนั้น (เพื่อดึง standard)
		var latestRec entity.EnvironmentalRecord
		err := db.
			Joins("JOIN parameters p ON p.id = environmental_records.parameter_id").
			Where("p.parameter_name = ?", "Nitrate").
			Where("DATE(environmental_records.date) = ?", dateStr).
			Where("environmental_records.environment_id = ?", rec.EnvironmentID).
			Order("environmental_records.date DESC").
			First(&latestRec).Error

		stdVal := "-"
		if err == nil && latestRec.StandardID != 0 {
			var std entity.Standard
			if db.First(&std, latestRec.StandardID).Error == nil {
				if (std.MinValue != -1 || std.MaxValue != -1) && (std.MinValue < std.MaxValue) {
					stdVal = fmt.Sprintf("%.2f - %.2f", std.MinValue, std.MaxValue)
				} else if std.MiddleValue > -1 {
					stdVal = fmt.Sprintf("%.2f", std.MiddleValue)
				}
			}
		}

		if _, exisni := niMap[k]; !exisni {
			unitName := rec.Unit.UnitName // default

			// ลองใช้ unit ของ latestRec ถ้ามี
			if latestRec.UnitID != 0 {
				var latestUnit entity.Unit
				if db.First(&latestUnit, latestRec.UnitID).Error == nil {
					unitName = latestUnit.UnitName
				}
			}

			niMap[k] = &NIRecord{
				Date:          dateStr,
				Unit:          unitName,
				StandardValue: stdVal,
			}
		}

		// Before / After
		val := rec.Data
		if rec.BeforeAfterTreatmentID == 1 {
			niMap[k].BeforeValue = &val
			niMap[k].BeforeID = &rec.ID
		} else if rec.BeforeAfterTreatmentID == 2 {
			niMap[k].AfterValue = &val
			niMap[k].AfterID = &rec.ID
		}

		// คำนวณ Status
		if niMap[k].AfterValue != nil && latestRec.StandardID != 0 {
			var std entity.Standard
			if db.First(&std, latestRec.StandardID).Error == nil {
				after := *niMap[k].AfterValue
				if std.MinValue != -1 || std.MaxValue != -1 {
					if after < float64(std.MinValue) || after > float64(std.MaxValue) {
						niMap[k].Status = "ไม่ผ่านเกณฑ์มาตรฐาน"
					} else {
						niMap[k].Status = "ผ่านเกณฑ์มาตรฐาน"
					}
				} else {
					if after > float64(std.MiddleValue) {
						niMap[k].Status = "ไม่ผ่านเกณฑ์มาตรฐาน"
					} else {
						niMap[k].Status = "ผ่านเกณฑ์มาตรฐาน"
					}
				}

				// อัปเดตลง DB ทันที (อัปเดต record หลังการบำบัด)
				if niMap[k].AfterID != nil {
					db.Model(&entity.EnvironmentalRecord{}).
						Where("id = ?", *niMap[k].AfterID).
						Update("status_id", getStatusIDFromName(niMap[k].Status)) // แปลงชื่อเป็น ID
				}
			}
		}
	}

	// สร้าง map รวบรวม id -> note เพื่อดึง note ของ before และ after จากข้อมูลดิบ
	noteMap := make(map[uint]string)
	for _, rec := range ni {
		noteMap[rec.ID] = rec.Note
	}

	// เติม BeforeNote และ AfterNote ใน niMap
	for _, val := range niMap {
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
	var mergedRecords []NIRecord
	for _, val := range niMap {
		mergedRecords = append(mergedRecords, *val)
	}

	c.JSON(http.StatusOK, mergedRecords)
}

func getStatusIDFromName(name string) uint {
	var status entity.Status
	if err := config.DB().Where("status_name = ?", name).First(&status).Error; err == nil {
		return status.ID
	}
	return 0 // หรือค่าดีฟอลต์ถ้าไม่เจอ
}

func UpdateOrCreateNI(c *gin.Context) {
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

	// ถ้า StandardID = 0 → สร้างใหม่จาก CustomStandard (ถ้าไม่มีซ้ำ)
	if input.StandardID == 0 && input.CustomStandard != nil {
		var existing entity.Standard
		query := db.Model(&entity.Standard{})

		switch input.CustomStandard.Type {
		case "middle":
			if input.CustomStandard.Value != nil {
				query = query.Where("middle_value = ?", *input.CustomStandard.Value)
			}
		case "range":
			if input.CustomStandard.Min != nil && input.CustomStandard.Max != nil {
				query = query.Where("min_value = ? AND max_value = ?", *input.CustomStandard.Min, *input.CustomStandard.Max)
			}
		}

		if err := query.First(&existing).Error; errors.Is(err, gorm.ErrRecordNotFound) {
			// กำหนดค่า default เป็น -1 ทุกตัว
			newStandard := entity.Standard{
				MiddleValue: -1,
				MinValue:    -1,
				MaxValue:    -1,
			}

			if input.CustomStandard.Type == "middle" && input.CustomStandard.Value != nil {
				newStandard.MiddleValue = float32(*input.CustomStandard.Value)
			} else if input.CustomStandard.Type == "range" {
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
		} else {
			input.StandardID = existing.ID
		}
	}

	// โหลด Standard
	var standard entity.Standard
	if err := db.First(&standard, input.StandardID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบข้อมูลเกณฑ์มาตรฐาน"})
		return
	}

	// ฟังก์ชันคำนวณ Status
	getStatusID := func(value float64) uint {
		var status entity.Status
		if standard.MiddleValue != -1 {
			if value <= float64(standard.MiddleValue) {
				db.Where("status_name = ?", "ผ่านเกณฑ์มาตรฐาน").First(&status)
			} else {
				db.Where("status_name = ?", "ไม่ผ่านเกณฑ์มาตรฐาน").First(&status)
			}
		} else {
			if value >= float64(standard.MinValue) && value <= float64(standard.MaxValue) {
				db.Where("status_name = ?", "ผ่านเกณฑ์มาตรฐาน").First(&status)
			} else {
				db.Where("status_name = ?", "ไม่ผ่านเกณฑ์มาตรฐาน").First(&status)
			}
		}
		return status.ID
	}

	// ตรวจสอบ CustomUnit
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
	// ให้ BeforeAfterTreatmentID = หลัง
	input.BeforeAfterTreatmentID = 2
	// Update หรือ Create
	if input.ID != 0 {
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
	}
}

func DeleteNI(c *gin.Context) {
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

	c.JSON(http.StatusOK, gin.H{"message": "ลบข้อมูล NI สำเร็จ"})
}

func GetNIbyID(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var ni struct {
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
		Scan(&ni)

	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
		return
	}

	c.JSON(http.StatusOK, ni)
}

func DeleteAllNIRecordsByDate(c *gin.Context) {
	id := c.Param("id")
	uintID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID ไม่ถูกต้อง"})
		return
	}

	db := config.DB()

	var environment entity.Environment
	if err := db.Where("environment_name = ?", "น้ำประปา").First(&environment).Error; err != nil {
		fmt.Println("Error fetching environment:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid environment"})
		return
	}

	// หา parameter
	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "Nitrate").First(&parameter).Error; err != nil {
		fmt.Println("Error fetching parameter:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	// หา record ก่อน
	var targetRecord entity.EnvironmentalRecord
	if err := db.First(&targetRecord, uint(uintID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลที่ต้องการลบ"})
		return
	}

	// ลบทั้งหมดที่มีวันที่เดียวกัน
	dateKey := targetRecord.Date.Format("2006-01-02")
	if err := db.Where("DATE(date) = ? AND parameter_id = ? AND environment_id = ?", dateKey, parameter.ID, environment.ID).
		Delete(&entity.EnvironmentalRecord{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "ลบข้อมูล NI สำเร็จ",
		"date":    dateKey,
	})
}

func GetBeforeAfterNI(c *gin.Context) {
	db := config.DB()

	var environment entity.Environment
	if err := db.Where("environment_name = ?", "น้ำประปา").First(&environment).Error; err != nil {
		fmt.Println("Error fetching environment:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid environment"})
		return
	}

	// หา parameter ของ NI
	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "Nitrate").First(&parameter).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	var Before entity.BeforeAfterTreatment
	if err := db.Where("treatment_name = ?", "ก่อน").First(&Before).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid environment"})
		return
	}

	var After entity.BeforeAfterTreatment
	if err := db.Where("treatment_name = ?", "หลัง").First(&After).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid environment"})
		return
	}

	type NIRecord struct {
		ID                     *uint              `json:"ID"`
		Date                   *time.Time         `json:"Date"`
		Data                   *float64           `json:"Data"`
		Note                   string             `json:"Note"`
		BeforeAfterTreatmentID *uint              `json:"BeforeAfterTreatmentID"`
		EnvironmentID          *uint              `json:"EnvironmentID"`
		ParameterID            *uint              `json:"ParameterID"`
		StandardID             *uint              `json:"StandardID"`
		UnitID                 *uint              `json:"UnitID"`
		EmployeeID             *uint              `json:"EmployeeID"`
		MinValue               *Float64TwoDecimal `json:"MinValue"`
		MiddleValue            *Float64TwoDecimal `json:"MiddleValue"`
		MaxValue               *Float64TwoDecimal `json:"MaxValue"`
		UnitName               string             `json:"UnitName"`
	}

	// ค่าว่างเริ่มต้น
	defaultEmpty := NIRecord{
		ID:                     nil,
		Date:                   nil,
		Data:                   nil,
		Note:                   "",
		BeforeAfterTreatmentID: nil,
		EnvironmentID:          nil,
		ParameterID:            nil,
		StandardID:             nil,
		UnitID:                 nil,
		EmployeeID:             nil,
		MinValue:               nil,
		MiddleValue:            nil,
		MaxValue:               nil,
		UnitName:               "",
	}

	var latestBefore NIRecord
	var latestAfter NIRecord

	// Query หา Before ล่าสุด
	errBefore := db.Model(&entity.EnvironmentalRecord{}).
		Select(`environmental_records.id, environmental_records.date, environmental_records.data, environmental_records.note,
				environmental_records.before_after_treatment_id, environmental_records.environment_id,
				environmental_records.parameter_id, environmental_records.standard_id, environmental_records.unit_id,
				environmental_records.employee_id, standards.min_value, standards.middle_value, standards.max_value,
				units.unit_name`).
		Joins("INNER JOIN standards ON environmental_records.standard_id = standards.id").
		Joins("INNER JOIN units ON environmental_records.unit_id = units.id").
		Where("parameter_id = ? AND before_after_treatment_id = ? AND environment_id = ?", parameter.ID, Before.ID, environment.ID).
		Order("environmental_records.date DESC").
		First(&latestBefore).Error

	// Query หา After ล่าสุด
	errAfter := db.Model(&entity.EnvironmentalRecord{}).
		Select(`environmental_records.id, environmental_records.date, environmental_records.data, environmental_records.note,
				environmental_records.before_after_treatment_id, environmental_records.environment_id,
				environmental_records.parameter_id, environmental_records.standard_id, environmental_records.unit_id,
				environmental_records.employee_id, standards.min_value, standards.middle_value, standards.max_value,
				units.unit_name`).
		Joins("INNER JOIN standards ON environmental_records.standard_id = standards.id").
		Joins("INNER JOIN units ON environmental_records.unit_id = units.id").
		Where("parameter_id = ? AND before_after_treatment_id = ? AND environment_id = ?", parameter.ID, After.ID, environment.ID).
		Order("environmental_records.date DESC").
		First(&latestAfter).Error

	// ถ้าไม่มีทั้ง Before และ After
	if errBefore != nil && errAfter != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No NI records found"})
		return
	}

	// ตรวจสอบวันที่
	beforeRes := defaultEmpty
	afterRes := defaultEmpty

	if errBefore == nil && errAfter == nil {
		if latestBefore.Date != nil && latestAfter.Date != nil &&
			latestBefore.Date.Format("2006-01-02") == latestAfter.Date.Format("2006-01-02") {
			// วันที่ตรงกัน
			beforeRes = latestBefore
			afterRes = latestAfter
		} else {
			// วันไม่ตรงกัน → เอาที่ล่าสุดกว่า
			if latestBefore.Date != nil && (latestAfter.Date == nil || latestBefore.Date.After(*latestAfter.Date)) {
				beforeRes = latestBefore
			} else {
				afterRes = latestAfter
			}
		}
	} else if errBefore == nil {
		beforeRes = latestBefore
	} else if errAfter == nil {
		afterRes = latestAfter
	}

	c.JSON(http.StatusOK, gin.H{
		"before": beforeRes,
		"after":  afterRes,
	})
}
