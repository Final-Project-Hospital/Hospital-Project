package hazardousWaste

import (
	"errors"
	"fmt"
	"math"
	"net/http"
	"sort"
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

func CreateHazardous(c *gin.Context) {
	var input struct {
		Date                time.Time
		Quantity            uint
		MonthlyGarbage      float64
		AverageDailyGarbage float64
		TotalSale           float64
		Note                string
		UnitID              uint
		CustomUnit          string
		EmployeeID          uint
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	// จัดการ CustomUnit
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

	// ดึง Parameter ที่ชื่อ "ขยะอันตราย"
	var param entity.Parameter
	if err := db.Where("parameter_name = ?", "ขยะอันตราย").First(&param).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบ Parameter ขยะอันตราย"})
		return
	}

	// ดึง Environment ที่ชื่อ "ขยะ"
	var env entity.Environment
	if err := db.Where("environment_name = ?", "ขยะ").First(&env).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบ Environment ขยะ"})
		return
	}

	// ลบ record ของวันเดียวกันและ ParameterID ตรงกัน
	startOfDay := time.Date(input.Date.Year(), input.Date.Month(), input.Date.Day(), 0, 0, 0, 0, input.Date.Location())
	endOfDay := startOfDay.AddDate(0, 0, 1).Add(-time.Nanosecond)
	if err := db.Where("date >= ? AND date <= ? AND parameter_id = ?", startOfDay, endOfDay, param.ID).
		Delete(&entity.Garbage{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบข้อมูลเก่าของวันเดียวกันไม่สำเร็จ"})
		return
	}

	// คำนวณปริมาณขยะต่อวันถ้าไม่ส่งมา
	if input.AverageDailyGarbage == 0 && input.MonthlyGarbage > 0 {
		daysInMonth := time.Date(input.Date.Year(), input.Date.Month()+1, 0, 0, 0, 0, 0, input.Date.Location()).Day()
		input.AverageDailyGarbage = input.MonthlyGarbage / float64(daysInMonth)
	}

	// สร้าง record ใหม่
	garbage := entity.Garbage{
		Date:                input.Date,
		Quantity:            input.Quantity,
		AADC:                0,
		MonthlyGarbage:      input.MonthlyGarbage,
		AverageDailyGarbage: input.AverageDailyGarbage,
		TotalSale:           input.TotalSale,
		Note:                input.Note,
		EnvironmentID:       env.ID,
		ParameterID:         param.ID,
		TargetID:            nil,
		UnitID:              input.UnitID,
		StatusID:            nil,
		EmployeeID:          input.EmployeeID,
	}

	if err := db.Create(&garbage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกข้อมูลไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "บันทึกขยะอันตรายสำเร็จ",
		"data":    garbage,
	})
}

func GetfirstHazardous(c *gin.Context) {
	db := config.DB()

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "ขยะอันตราย").First(&parameter).Error; err != nil {
		fmt.Println("Error fetching parameter:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	// โครงสร้างสำหรับจัดเก็บข้อมูลผลลัพธ์
	var firstHaz struct {
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
		UnitID              uint      `json:"UnitID"`
		EmployeeID          uint      `json:"EmployeeID"`
		UnitName            string    `json:"UnitName"`
	}

	// คำสั่ง SQL ที่แก้ไขให้ใช้ DISTINCT ใน GROUP_CONCAT
	result := db.Model(&entity.Garbage{}).
		Select(`garbages.id, garbages.date, garbages.quantity,garbages.aadc,garbages.monthly_garbage,garbages.average_daily_garbage,garbages.total_sale,garbages.note,garbages.environment_id,garbages.parameter_id,units.unit_name,units.id as unit_id`).
		Joins("inner join units on garbages.unit_id = units.id").
		Where("parameter_id = ?", parameter.ID).
		Order("garbages.created_at desc").
		Scan(&firstHaz)

	// จัดการกรณีที่เกิดข้อผิดพลาด
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	// ส่งข้อมูลกลับในรูปแบบ JSON
	c.JSON(http.StatusOK, firstHaz)
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

func ListHazardous(c *gin.Context) {
	db := config.DB()

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "ขยะอันตราย").First(&parameter).Error; err != nil {
		fmt.Println("Error fetching parameter:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	var firstHaz []struct {
		ID                  uint      `json:"ID"`
		Date                time.Time `json:"Date"`
		Quantity            uint      `json:"Quantity"`
		Note                string    `json:"Note"`
		Aadc                float64   `json:"Aadc"`
		EnvironmentID       uint      `json:"EnvironmentID"`
		ParameterID         uint      `json:"ParameterID"`
		TargetID            uint      `json:"TargetID"`
		UnitID              uint      `json:"UnitID"`
		EmployeeID          uint      `json:"EmployeeID"`
		UnitName            string
		MonthlyGarbage      float64 `json:"MonthlyGarbage"`
		AverageDailyGarbage float64 `json:"AverageDailyGarbage"`
	}
	subQuery := db.Model(&entity.Garbage{}).
		Select("MAX(id)").
		Where("parameter_id = ?", parameter.ID).
		Group("DATE(date)")

	// คำสั่ง SQL ที่แก้ไขให้ใช้ DISTINCT ใน GROUP_CONCAT
	result := db.Model(&entity.Garbage{}).
		Select(`garbages.id, garbages.date,garbages.monthly_garbage,garbages.average_daily_garbage,garbages.quantity,garbages.note,garbages.aadc,garbages.environment_id ,garbages.parameter_id 
		,garbages.target_id ,garbages.unit_id ,garbages.employee_id,units.unit_name`).
		Joins("inner join units on garbages.unit_id = units.id").
		Where("garbages.id IN (?)", subQuery).
		Order("garbages.date DESC").
		Find(&firstHaz)

	if result.Error != nil {
		fmt.Println("Error:", result.Error)
	} else {
		fmt.Println("Rows:", result.RowsAffected)
	}

	// จัดการกรณีที่เกิดข้อผิดพลาด
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	// ส่งข้อมูลกลับในรูปแบบ JSON
	c.JSON(http.StatusOK, firstHaz)
}

func GetHazardousTABLE(c *gin.Context) {
	db := config.DB()

	// หา ParameterID ของ "ขยะอันตราย"
	var param entity.Parameter
	if err := db.Where("parameter_name = ?", "ขยะอันตราย").First(&param).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่พบ Parameter ขยะอันตราย"})
		return
	}

	// ดึงข้อมูลจากตาราง garbages พร้อม preload
	var Haz []entity.Garbage
	result := db.Preload("Environment").
		Preload("Unit").
		Preload("Employee").
		Where("parameter_id = ?", param.ID).
		Order("date DESC"). // ✅ ดึงเรียงจากล่าสุดไปเก่า
		Find(&Haz)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	type keyType struct {
		Date          string
		EnvironmentID uint
	}

	type HazardousRecord struct {
		ID                  uint      `json:"ID"`
		Date                time.Time `json:"date"`
		Quantity            uint      `json:"quantity"`
		MonthlyGarbage      float64   `json:"monthly_garbage"`
		AverageDailyGarbage float64   `json:"average_daily_garbage"`
		TotalSale           float64   `json:"total_sale"`
		Note                string    `json:"note"`
		UnitID              uint      `json:"unit_id"`
		Unit                string    `json:"unit"`
		EmployeeID          uint      `json:"employee_id"`
	}

	HazMap := make(map[keyType]*HazardousRecord)

	for _, rec := range Haz {
		dateStr := rec.Date.Format("2006-01-02")
		k := keyType{
			Date:          dateStr,
			EnvironmentID: rec.EnvironmentID,
		}

		// ถ้า key นี้ยังไม่เคยถูกบันทึก แสดงว่าเป็น record ล่าสุดของวันนั้น
		if _, exists := HazMap[k]; !exists {
			HazMap[k] = &HazardousRecord{
				ID:                  rec.ID,
				Date:                rec.Date,
				Quantity:            rec.Quantity,
				MonthlyGarbage:      rec.MonthlyGarbage,
				AverageDailyGarbage: rec.AverageDailyGarbage,
				TotalSale:           rec.TotalSale,
				Note:                rec.Note,
				UnitID:              rec.UnitID,
				Unit:                rec.Unit.UnitName,
				EmployeeID:          rec.EmployeeID,
			}
		}
	}

	// แปลง map เป็น slice
	var mergedRecords []HazardousRecord
	for _, val := range HazMap {
		mergedRecords = append(mergedRecords, *val)
	}

	// เรียงจากวันล่าสุดไปเก่าสุด
	sort.Slice(mergedRecords, func(i, j int) bool {
		return mergedRecords[i].Date.After(mergedRecords[j].Date)
	})

	c.JSON(http.StatusOK, mergedRecords)
}

func UpdateOrCreateHazardous(c *gin.Context) {
	var input struct {
		entity.Garbage
		CustomUnit *string `json:"CustomUnit,omitempty"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "ขยะอันตราย").First(&parameter).Error; err != nil {
		fmt.Println("Error fetching parameter:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	// ✅ จัดการ CustomUnit
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
		var existing entity.Garbage
		if err := db.First(&existing, input.ID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลขยะอันตราย"})
			return
		}

		updatedData := map[string]interface{}{
			"Date":                input.Date,
			"Quantity":            input.Quantity,
			"MonthlyGarbage":      input.MonthlyGarbage,
			"AverageDailyGarbage": input.AverageDailyGarbage,
			"TotalSale":           input.TotalSale,
			"Note":                input.Note,
			"UnitID":              input.UnitID,
			"EmployeeID":          input.EmployeeID,
		}

		if err := db.Model(&existing).Updates(updatedData).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดตข้อมูลล้มเหลว"})
			return
		}

		// อัปเดต Unit ให้ record ของวันเดียวกัน
		db.Model(&entity.Garbage{}).
			Where("DATE(date) = ?", input.Date.Format("2006-01-02")).
			Where("parameter_id = ?", parameter.ID).
			Update("unit_id", input.UnitID)

		c.JSON(http.StatusOK, gin.H{"message": "อัปเดตข้อมูลขยะอันตรายสำเร็จ", "data": existing})
	} else {
		// Create
		if err := db.Create(&input.Garbage).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างข้อมูลล้มเหลว"})
			return
		}

		// อัปเดต Unit ให้ record ของวันเดียวกัน
		db.Model(&entity.Garbage{}).
			Where("DATE(date) = ?", input.Date.Format("2006-01-02")).
			Where("parameter_id = ?", parameter.ID).
			Update("unit_id", input.UnitID)

		c.JSON(http.StatusOK, gin.H{"message": "สร้างข้อมูลขยะอันตรายสำเร็จ", "data": input})
	}
}

func GetHazardousbyID(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var Haz struct {
		ID                  uint      `json:"ID"`
		Date                time.Time `json:"Date"`
		Note                string    `json:"Note"`
		UnitID              uint      `json:"UnitID"`
		EmployeeID          uint      `json:"EmployeeID"`
		Quantity            uint      `json:"Quantity"`
		MonthlyGarbage      float64   `json:"MonthlyGarbage"`
		AverageDailyGarbage float64   `json:"AverageDailyGarbage"`
		TotalSale           float64   `json:"TotalSale"`
	}

	result := db.Model(&entity.Garbage{}).
		Select(`id, date, note, unit_id, employee_id, quantity, monthly_garbage, average_daily_garbage, total_sale`).
		Where("id = ?", id).
		Scan(&Haz)

	if result.Error != nil || result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
		return
	}

	c.JSON(http.StatusOK, Haz)
}

func DeleteAllHazardousRecordsByDate(c *gin.Context) {
	id := c.Param("id")
	uintID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID ไม่ถูกต้อง"})
		return
	}

	db := config.DB()

	// หา ParameterID ของ "ขยะอันตราย"
	var param entity.Parameter
	if err := db.Where("parameter_name = ?", "ขยะอันตราย").First(&param).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่พบ Parameter ขยะอันตราย"})
		return
	}

	// หา record ขยะอันตรายที่เลือก
	var targetRecord entity.Garbage
	if err := db.First(&targetRecord, uint(uintID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลขยะอันตราย"})
		return
	}

	// ลบทั้งหมดที่มีวันที่เดียวกัน (ใช้เฉพาะ Date ไม่เอา Time)
	dateKey := targetRecord.Date.Format("2006-01-02")
	if err := db.Where("DATE(date) = ? AND parameter_id = ?", dateKey, param.ID).
		Delete(&entity.Garbage{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "ลบข้อมูลขยะอันตรายทั้งหมดของวันสำเร็จ",
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

func GetLastDayHazardous(c *gin.Context) {
	db := config.DB()

	var parameter entity.Parameter
	if err := db.Where("parameter_name = ?", "ขยะอันตราย").First(&parameter).Error; err != nil {
		fmt.Println("Error fetching parameter:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid parameter"})
		return
	}

	// โครงสร้างสำหรับจัดเก็บข้อมูลผลลัพธ์
	var firstHaz struct {
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
		UnitName            string    `json:"UnitName"`
	}

	// คำสั่ง SQL ที่แก้ไขให้ใช้ DISTINCT ใน GROUP_CONCAT
	result := db.Model(&entity.Garbage{}).
		Select(`garbages.id, garbages.date, garbages.quantity,garbages.aadc,garbages.monthly_garbage,garbages.average_daily_garbage,garbages.total_sale,garbages.note,garbages.environment_id,garbages.parameter_id,garbages.target_id,garbages.unit_id,garbages.employee_id,units.unit_name`).
		Joins("inner join units on garbages.unit_id = units.id").
		Where("parameter_id = ?", parameter.ID).
		Order("garbages.date desc").
		Scan(&firstHaz)

	// จัดการกรณีที่เกิดข้อผิดพลาด
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	// ส่งข้อมูลกลับในรูปแบบ JSON
	c.JSON(http.StatusOK, firstHaz)
}