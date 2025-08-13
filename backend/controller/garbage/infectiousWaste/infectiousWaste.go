package infectiousWaste

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

func CreateInfectious(c *gin.Context) {
	var input struct {
		Date                time.Time
		Quantity            uint
		AADC                float64
		MonthlyGarbage      float64
		AverageDailyGarbage float64
		TotalSale           float64
		Note                string
		TargetID            uint
		UnitID              uint
		CustomUnit          string
		EmployeeID          uint
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
			fmt.Println(" เกิดข้อผิดพลาดในการตรวจสอบหน่วย:", err)
			// ไม่คืน error ไปยัง frontend
		}
	}

	// ดึง Parameter ที่ชื่อ "ขยะติดเชื้อ"
	var param entity.Parameter
	if err := db.Where("parameter_name = ?", "ขยะติดเชื้อ").First(&param).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบ Parameter ขยะติดเชื้อ"})
		return
	}

	// ดึง Environment ที่ชื่อ "ขยะ"
	var env entity.Environment
	if err := db.Where("environment_name = ?", "ขยะ").First(&env).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบ Environment ขยะ"})
		return
	}

	// ตรวจสอบ TargetID ว่ามีหรือไม่
	var target entity.Target
	if input.TargetID == 0 || db.First(&target, input.TargetID).Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบข้อมูลเกณฑ์มาตรฐาน หรือไม่ได้เลือก"})
		return
	}

	// ฟังก์ชันคำนวณ StatusID ตามค่า Target
	getStatusID := func(value float64) uint {
		var status entity.Status
		if target.MiddleTarget != 0 { // ค่าเดี่ยว
			if value > float64(target.MiddleTarget) {
				db.Where("status_name = ?", "ไม่ผ่านเกณฑ์มาตรฐาน").First(&status)
			} else {
				db.Where("status_name = ?", "ผ่านเกณฑ์มาตรฐาน").First(&status)
			}
		} else { // ค่าเป็นช่วง
			if value >= float64(target.MinTarget) && value <= float64(target.MaxTarget) {
				db.Where("status_name = ?", "ผ่านเกณฑ์มาตรฐาน").First(&status)
			} else {
				db.Where("status_name = ?", "ไม่ผ่านเกณฑ์มาตรฐาน").First(&status)
			}
		}
		return status.ID
	}

	// คำนวณปริมาณขยะต่อวันถ้าไม่ส่งมา
	if input.AverageDailyGarbage == 0 && input.MonthlyGarbage > 0 {
		// หาจำนวนวันจริงในเดือน
		daysInMonth := time.Date(input.Date.Year(), input.Date.Month()+1, 0, 0, 0, 0, 0, input.Date.Location()).Day()
		input.AverageDailyGarbage = input.MonthlyGarbage / float64(daysInMonth)
	}
		// แปลง uint เป็น *uint สำหรับ TargetID และ StatusID
	var targetIDPtr *uint
	if input.TargetID != 0 {
		targetIDPtr = &input.TargetID
	} else {
		targetIDPtr = nil
	}

	statusID := getStatusID(input.AADC)
	var statusIDPtr *uint
	if statusID != 0 {
		statusIDPtr = &statusID
	} else {
		statusIDPtr = nil
	}

	garbage := entity.Garbage{
		Date:                input.Date,
		Quantity:            input.Quantity,
		AADC:                input.AADC,
		MonthlyGarbage:      input.MonthlyGarbage,
		AverageDailyGarbage: input.AverageDailyGarbage,
		TotalSale:           input.TotalSale,
		Note:                input.Note,
		EnvironmentID:       env.ID,
		ParameterID:         param.ID,
		TargetID:           targetIDPtr,
		UnitID:              input.UnitID,
		StatusID:            statusIDPtr,
		EmployeeID:          input.EmployeeID,
	}

	if err := db.Create(&garbage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกข้อมูลไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "บันทึกขยะติดเชื้อสำเร็จ",
		"data":    garbage,
	})
}

func GetfirstInfectious(c *gin.Context) {
	db := config.DB()

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "ขยะติดเชื้อ").First(&parameter).Error; err != nil {
		fmt.Println("Error fetching parameter:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	// โครงสร้างสำหรับจัดเก็บข้อมูลผลลัพธ์
	var firstinf struct {
		ID                  uint      `json:"ID"`
		Date                time.Time `json:"Date"`
		Quantity            uint      `json:"Quantity"`
		AADC                float64   `json:"AADC"`
		MonthlyGarbage      float64   `json:"MonthlyGarbage"`
		AverageDailyGarbage float64   `json:"AverageDailyGarbage"`
		TotalSale           float64   `json:"TotalSale"`
		Note                string    `json:"Note"`
		EnvironmentID       uint      `json:"EnvironmentID"`
		ParameterID         uint      `json:"ParameterID"`
		TargetID            uint      `json:"TargetID"`
		UnitID              uint      `json:"UnitID"`
		EmployeeID          uint      `json:"EmployeeID"`
		MinTarget           float64   `json:"MinTarget"`
		MiddleTarget        float64   `json:"MiddleTarget"`
		MaxTarget           float64   `json:"MaxTarget"`
		UnitName            string    `json:"UnitName"`
	}

	// คำสั่ง SQL ที่แก้ไขให้ใช้ DISTINCT ใน GROUP_CONCAT
	result := db.Model(&entity.Garbage{}).
		Select(`garbages.id, garbages.date, garbages.quantity,garbages.aadc,garbages.monthly_garbage,garbages.average_daily_garbage,garbages.total_sale,garbages.note,garbages.environment_id,garbages.parameter_id,garbages.target_id,garbages.unit_id,garbages.employee_id,targets.min_target,targets.middle_target,targets.max_target,units.unit_name`).
		Joins("inner join targets on garbages.target_id = targets.id").
		Joins("inner join units on garbages.unit_id = units.id").
		Where("parameter_id = ?", parameter.ID).
		Order("garbages.created_at desc").
		Scan(&firstinf)

	// จัดการกรณีที่เกิดข้อผิดพลาด
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	// ส่งข้อมูลกลับในรูปแบบ JSON
	c.JSON(http.StatusOK, firstinf)
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

func ListInfectious(c *gin.Context) {
	db := config.DB()

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "ขยะติดเชื้อ").First(&parameter).Error; err != nil {
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
	var firstinf []struct {
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

	// คำสั่ง SQL ที่แก้ไขให้ใช้ DISTINCT ใน GROUP_CONCAT
	result := db.Model(&entity.EnvironmentalRecord{}).
		Select(`environmental_records.id, environmental_records.date,environmental_records.data,environmental_records.note,environmental_records.before_after_treatment_id,environmental_records.environment_id ,environmental_records.parameter_id 
		,environmental_records.target_id ,environmental_records.unit_id ,environmental_records.employee_id,units.unit_name,before_after_treatments.treatment_name,targets.min_target,targets.middle_target,targets.max_target,statuses.status_name`).
		Joins("inner join targets on environmental_records.target_id = targets.id").
		Joins("inner join units on environmental_records.unit_id = units.id").
		Joins("inner join before_after_treatments on environmental_records.before_after_treatment_id = before_after_treatments.id").
		Joins("inner join statuses on environmental_records.status_id = statuses.id").
		Where("environmental_records.parameter_id = ? ", parameter.ID).
		Find(&firstinf)

	// จัดการกรณีที่เกิดข้อผิดพลาด
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	// ส่งข้อมูลกลับในรูปแบบ JSON
	c.JSON(http.StatusOK, firstinf)
}

func DeleterInfectious(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	// Update `deleted_at` field to mark as deleted (using current timestamp)
	if tx := db.Exec("UPDATE environmental_records SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id not found or already deleted"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Soft Deleted Environmental Records Successfully"})
}

func GetInfectiousTABLE(c *gin.Context) {
	db := config.DB()

	// หา ParameterID ของ "ขยะติดเชื้อ"
	var param entity.Parameter
	if err := db.Where("parameter_name = ?", "ขยะติดเชื้อ").First(&param).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่พบ Parameter ขยะติดเชื้อ"})
		return
	}

	var inf []entity.EnvironmentalRecord
	result := db.Preload("BeforeAfterTreatment").
		Preload("Environment").
		Preload("Unit").
		Preload("Employee").
		Where("parameter_id = ?", param.ID).
		Find(&inf)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	type keyType struct {
		Date          string
		EnvironmentID uint
	}

	type InfectiousRecord struct {
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

	infMap := make(map[keyType]*InfectiousRecord)

	for _, rec := range inf {
		dateStr := rec.Date.Format("2006-01-02")
		k := keyType{
			Date:          dateStr,
			EnvironmentID: rec.EnvironmentID,
		}

		// หา EnvironmentalRecord ล่าสุดของวันนั้น (เพื่อดึง standard)
		var latestRec entity.EnvironmentalRecord
		err := db.
			Joins("JOIN parameters p ON p.id = environmental_records.parameter_id").
			Where("p.parameter_name = ?", "ขยะติดเชื้อ").
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
		if _, exists := infMap[k]; !exists {
			unitName := rec.Unit.UnitName // default

			// ลองใช้ unit ของ latestRec ถ้ามี
			if latestRec.UnitID != 0 {
				var latestUnit entity.Unit
				if db.First(&latestUnit, latestRec.UnitID).Error == nil {
					unitName = latestUnit.UnitName
				}
			}

			infMap[k] = &InfectiousRecord{
				Date:          dateStr,
				Unit:          unitName,
				StandardValue: stdVal,
			}
		}

		// Before / After
		val := rec.Data
		if rec.BeforeAfterTreatmentID == 1 {
			infMap[k].BeforeValue = &val
			infMap[k].BeforeID = &rec.ID
		} else if rec.BeforeAfterTreatmentID == 2 {
			infMap[k].AfterValue = &val
			infMap[k].AfterID = &rec.ID
		}

		// Efficiency
		if infMap[k].BeforeValue != nil && infMap[k].AfterValue != nil && *infMap[k].BeforeValue != 0 {
			eff := ((*infMap[k].BeforeValue - *infMap[k].AfterValue) / (*infMap[k].BeforeValue)) * 100
			// ✅ ถ้าค่าติดลบให้กลายเป็น 0.00
			//fmt.Printf("Efficiency2: %.2f\n", eff)
			if eff < 0 {
				eff = 0.00
			}
			infMap[k].Efficiency = &eff
		}

		// Status
		if infMap[k].AfterValue != nil && latestRec.StandardID != 0 {
			var std entity.Standard
			if db.First(&std, latestRec.StandardID).Error == nil {
				after := *infMap[k].AfterValue
				if std.MinValue != 0 || std.MaxValue != 0 {
					if after < float64(std.MinValue) || after > float64(std.MaxValue) {
						infMap[k].Status = "ไม่ผ่านเกณฑ์มาตรฐาน"
					} else {
						infMap[k].Status = "ผ่านเกณฑ์มาตรฐาน"
					}
				} else {
					if after > float64(std.MiddleValue) {
						infMap[k].Status = "ไม่ผ่านเกณฑ์มาตรฐาน"
					} else {
						infMap[k].Status = "ผ่านเกณฑ์มาตรฐาน"
					}
				}
			}
		}
	}

	// สร้าง map รวบรวม id -> note เพื่อดึง note ของ before และ after จากข้อมูลดิบ
	noteMap := make(map[uint]string)
	for _, rec := range inf {
		noteMap[rec.ID] = rec.Note
	}

	// เติม BeforeNote และ AfterNote ใน infMap
	for _, val := range infMap {
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
	var mergedRecords []InfectiousRecord
	for _, val := range infMap {
		mergedRecords = append(mergedRecords, *val)
	}

	c.JSON(http.StatusOK, mergedRecords)
}

func UpdateOrCreateInfectious(c *gin.Context) {
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

	// ✅ ถ้า StandardID = 0 → สร้างใหม่จาก CustomStandard (ถ้าไม่มีซ้ำ)
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
			newStandard := entity.Standard{}
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

	// ✅ โหลด Standard ที่จะใช้
	var standard entity.Standard
	if err := db.First(&standard, input.StandardID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบข้อมูลเกณฑ์มาตรฐาน"})
		return
	}

	// ✅ ฟังก์ชันคำนวณสถานะ
	getStatusID := func(value float64) uint {
		var status entity.Status

		if standard.MiddleValue != 0 {
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

		// ✅ อัปเดต Unit ให้ record ทั้งวันเดียวกัน
		sameDay := input.Date.Truncate(24 * time.Hour)
		db.Model(&entity.EnvironmentalRecord{}).
			Where("DATE(date) = ?", sameDay.Format("2006-01-02")).
			Update("unit_id", input.UnitID)

		c.JSON(http.StatusOK, gin.H{"message": "อัปเดตข้อมูลสำเร็จ", "data": existing})

	} else {
		// Create
		input.StatusID = getStatusID(input.Data)
		if err := db.Create(&input.EnvironmentalRecord).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างข้อมูลล้มเหลว"})
			return
		}

		// ✅ อัปเดต Unit ให้ record ทั้งวันเดียวกัน
		sameDay := input.Date.Truncate(24 * time.Hour)
		db.Model(&entity.EnvironmentalRecord{}).
			Where("DATE(date) = ?", sameDay.Format("2006-01-02")).
			Update("unit_id", input.UnitID)

		c.JSON(http.StatusOK, gin.H{"message": "สร้างข้อมูลใหม่สำเร็จ", "data": input})
	}
}

func DeleteInfectious(c *gin.Context) {
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

	c.JSON(http.StatusOK, gin.H{"message": "ลบข้อมูล Infectious สำเร็จ"})
}

func GetInfectiousbyID(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var inf struct {
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
		Scan(&inf)

	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
		return
	}

	c.JSON(http.StatusOK, inf)
}

func DeleteAllInfectiousRecordsByDate(c *gin.Context) {
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
		"message": "ลบข้อมูล Infectious สำเร็จ",
		"date":    dateKey,
	})
}

// ใช้ส่วนรวม
func CheckTarget(c *gin.Context) {
	targetType := c.Query("type")

	if targetType == "middle" {
		middleTarget := c.Query("value")
		var tar entity.Target
		if err := config.DB().Where("middle_target = ?", middleTarget).First(&tar).Error; err == nil {
			c.JSON(200, gin.H{"exists": true})
			return
		}
		c.JSON(200, gin.H{"exists": false})
		return
	}

	if targetType == "range" {
		min := c.Query("min")
		max := c.Query("max")
		var tar entity.Target
		if err := config.DB().
			Where("min_target = ? AND max_target = ?", min, max).
			First(&tar).Error; err == nil {
			c.JSON(200, gin.H{"exists": true})
			return
		}
		c.JSON(200, gin.H{"exists": false})
		return
	}

	c.JSON(400, gin.H{"error": "invalid type"})
}
