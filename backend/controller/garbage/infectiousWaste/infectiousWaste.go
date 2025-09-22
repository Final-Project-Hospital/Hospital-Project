package infectiousWaste

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

func CreateInfectious(c *gin.Context) {
	var input struct {
		Date                time.Time `json:"Date"`
		Quantity            uint      `json:"Quantity"`
		AADC                float64   `json:"AADC"`
		MonthlyGarbage      float64   `json:"MonthlyGarbage"`
		AverageDailyGarbage float64   `json:"AverageDailyGarbage"`
		TotalSale           float64   `json:"TotalSale"`
		Note                string    `json:"Note"`
		TargetID            uint      `json:"TargetID"`
		UnitID              uint      `json:"UnitID"`
		CustomUnit          string    `json:"CustomUnit"`
		EmployeeID          uint      `json:"EmployeeID"`
		CustomTarget        *struct {
			Type  string   `json:"type"`
			Value *float64 `json:"value,omitempty"`
			Min   *float64 `json:"min,omitempty"`
			Max   *float64 `json:"max,omitempty"`
		} `json:"CustomTarget,omitempty"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	// จัดการ Unit
	if input.CustomUnit != "" {
		var existingUnit entity.Unit
		if err := db.Where("unit_name = ?", input.CustomUnit).First(&existingUnit).Error; err == nil {
			input.UnitID = existingUnit.ID
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			newUnit := entity.Unit{UnitName: input.CustomUnit}
			if err := db.Create(&newUnit).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้าง Unit ใหม่ได้"})
				return
			}
			input.UnitID = newUnit.ID
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดในการตรวจสอบ Unit"})
			return
		}
	}

	// หา Parameter "ขยะติดเชื้อ"
	var param entity.Parameter
	if err := db.Where("parameter_name = ?", "ขยะติดเชื้อ").First(&param).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบ Parameter ขยะติดเชื้อ"})
		return
	}

	// หา Environment "ขยะ"
	var env entity.Environment
	if err := db.Where("environment_name = ?", "ขยะ").First(&env).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบ Environment ขยะ"})
		return
	}

	// จัดการ Target
	var targetID uint
	var target entity.Target
	if input.CustomTarget != nil {
		newTarget := entity.Target{}
		if input.CustomTarget.Type == "middle" && input.CustomTarget.Value != nil {
			newTarget.MiddleTarget = *input.CustomTarget.Value
		} else if input.CustomTarget.Type == "range" && input.CustomTarget.Min != nil && input.CustomTarget.Max != nil {
			newTarget.MinTarget = *input.CustomTarget.Min
			newTarget.MaxTarget = *input.CustomTarget.Max
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูล CustomTarget ไม่ถูกต้อง"})
			return
		}

		if err := db.Create(&newTarget).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้าง Target ใหม่ได้"})
			return
		}
		targetID = newTarget.ID
		target = newTarget
	} else if input.TargetID != 0 {
		if err := db.First(&target, input.TargetID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบ Target ที่เลือก"})
			return
		}
		targetID = target.ID
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบข้อมูลเกณฑ์มาตรฐาน หรือไม่ได้เลือก"})
		return
	}
	targetIDPtr := &targetID

	// ฟังก์ชันตรวจสอบ Status
	getStatusID := func(value float64) uint {
		var status entity.Status
		// ฟังก์ชันช่วยปัด 2 ตำแหน่ง
		round2 := func(f float64) float64 {
			return math.Round(f*100) / 100
		}
		value = round2(value)
		middle := round2(target.MiddleTarget)
		min := round2(target.MinTarget)
		max := round2(target.MaxTarget)

		if middle != 0 {
			if value >= middle {
				db.Where("status_name = ?", "ไม่ผ่านเกณฑ์มาตรฐาน").First(&status)
			} else {
				db.Where("status_name = ?", "ผ่านเกณฑ์มาตรฐาน").First(&status)
			}
		} else {
			if value >= min && value <= max {
				db.Where("status_name = ?", "ผ่านเกณฑ์มาตรฐาน").First(&status)
			} else {
				db.Where("status_name = ?", "ไม่ผ่านเกณฑ์มาตรฐาน").First(&status)
			}
		}
		return status.ID
	}

	// คำนวณ AverageDailyGarbage ถ้าเป็น 0
	if input.AverageDailyGarbage == 0 && input.MonthlyGarbage > 0 {
		daysInMonth := time.Date(input.Date.Year(), input.Date.Month()+1, 0, 0, 0, 0, 0, input.Date.Location()).Day()
		input.AverageDailyGarbage = input.MonthlyGarbage / float64(daysInMonth)
	}

	// แปลง StatusID เป็น *uint
	statusID := getStatusID(input.AADC)
	var statusIDPtr *uint
	if statusID != 0 {
		statusIDPtr = &statusID
	}

	if err := db.Where("DATE(date) = DATE(?) AND parameter_id = ?", input.Date, param.ID).
		Delete(&entity.Garbage{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบข้อมูลเก่าของวันเดียวกันไม่สำเร็จ"})
		return
	}

	// สร้าง Garbage ใหม่
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
		TargetID:            targetIDPtr,
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
		Order("garbages.date desc").
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
	// โครงสร้างสำหรับจัดเก็บข้อมูลผลลัพธ์
	var firstinf []struct {
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
		MinTarget           float64   `json:"MinTarget"`
		MiddleTarget        float64   `json:"MiddleTarget"`
		MaxTarget           float64   `json:"MaxTarget"`
		UnitName            string
		StatusName          string
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
		,garbages.target_id ,garbages.unit_id ,garbages.employee_id,units.unit_name,targets.min_target,targets.middle_target,targets.max_target,statuses.status_name`).
		Joins("inner join targets on garbages.target_id = targets.id").
		Joins("inner join units on garbages.unit_id = units.id").
		Joins("inner join statuses on garbages.status_id = statuses.id").
		Where("garbages.id IN (?)", subQuery).
		Order("garbages.date DESC").
		Find(&firstinf)

	// จัดการกรณีที่เกิดข้อผิดพลาด
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	// ส่งข้อมูลกลับในรูปแบบ JSON
	c.JSON(http.StatusOK, firstinf)
}

func GetInfectiousTABLE(c *gin.Context) {
	db := config.DB()

	// หา ParameterID ของ "ขยะติดเชื้อ"
	var param entity.Parameter
	if err := db.Where("parameter_name = ?", "ขยะติดเชื้อ").First(&param).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่พบ Parameter ขยะติดเชื้อ"})
		return
	}

	type InfectiousRecord struct {
		ID                  uint      `json:"id"`
		Date                time.Time `json:"date"`
		Quantity            uint      `json:"quantity"`
		AADC                float64   `json:"aadc"`
		MonthlyGarbage      float64   `json:"monthly_garbage"`
		AverageDailyGarbage float64   `json:"average_daily_garbage"`
		TotalSale           float64   `json:"total_sale"`
		Note                string    `json:"note"`
		EnvironmentID       uint      `json:"environment_id"`
		ParameterID         uint      `json:"parameter_id"`
		TargetID            *uint     `json:"target_id"`
		UnitID              uint      `json:"unit_id"`
		EmployeeID          uint      `json:"employee_id"`
		MinTarget           float64   `json:"min_target"`
		MiddleTarget        float64   `json:"middle_target"`
		MaxTarget           float64   `json:"max_target"`
		TargetValue         float64   `json:"target_value"`
		Status              string    `json:"status"` // ดึงจาก table Status
		UnitName            string    `json:"unit_name"`
	}

	var records []InfectiousRecord

	result := db.Table("garbages").
		Select(`garbages.id, garbages.date, garbages.quantity, garbages.aadc, garbages.monthly_garbage,
		        garbages.average_daily_garbage, garbages.total_sale, garbages.note, garbages.environment_id,
		        garbages.parameter_id, garbages.target_id, garbages.unit_id, garbages.employee_id,
		        targets.min_target, targets.middle_target, targets.max_target,
		        statuses.status_name as status, units.unit_name`).
		Joins("inner join targets on garbages.target_id = targets.id").
		Joins("left join statuses on garbages.status_id = statuses.id").
		Joins("inner join units on garbages.unit_id = units.id").
		Where("garbages.parameter_id = ? AND garbages.deleted_at IS NULL", param.ID).
		Order("garbages.created_at desc").
		Scan(&records)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	// กำหนด TargetValue จาก MiddleTarget
	for i := range records {
		records[i].TargetValue = records[i].MiddleTarget
	}

	c.JSON(http.StatusOK, records)
}

func UpdateOrCreateInfectious(c *gin.Context) {
	db := config.DB()

	var input struct {
		ID                  uint      `json:"ID"`
		Date                time.Time `json:"Date"`
		Quantity            uint      `json:"Quantity"`
		AADC                float64   `json:"AADC"`
		MonthlyGarbage      float64   `json:"MonthlyGarbage"`
		AverageDailyGarbage float64   `json:"AverageDailyGarbage"`
		TotalSale           float64   `json:"TotalSale"`
		Note                string    `json:"Note"`
		TargetID            *uint     `json:"TargetID"`
		UnitID              uint      `json:"UnitID"`
		CustomUnit          string    `json:"CustomUnit"`
		EmployeeID          uint      `json:"EmployeeID"`
		CustomTarget        *struct {
			Type  string   `json:"type"`
			Value *float64 `json:"value,omitempty"`
			Min   *float64 `json:"min,omitempty"`
			Max   *float64 `json:"max,omitempty"`
		} `json:"CustomTarget"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// จัดการ CustomUnit
	if input.CustomUnit != "" {
		var existingUnit entity.Unit
		if err := db.Where("unit_name = ?", input.CustomUnit).First(&existingUnit).Error; err == nil {
			input.UnitID = existingUnit.ID
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			newUnit := entity.Unit{UnitName: input.CustomUnit}
			if err := db.Create(&newUnit).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้าง Unit ใหม่ได้"})
				return
			}
			input.UnitID = newUnit.ID
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดในการตรวจสอบ Unit"})
			return
		}
	}

	// จัดการ CustomTarget
	var targetID *uint = input.TargetID
	if input.CustomTarget != nil {
		newTarget := entity.Target{}
		if input.CustomTarget.Type == "middle" && input.CustomTarget.Value != nil {
			newTarget.MiddleTarget = *input.CustomTarget.Value
		} else if input.CustomTarget.Type == "range" && input.CustomTarget.Min != nil && input.CustomTarget.Max != nil {
			newTarget.MinTarget = *input.CustomTarget.Min
			newTarget.MaxTarget = *input.CustomTarget.Max
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูล CustomTarget ไม่ถูกต้อง"})
			return
		}

		if err := db.Create(&newTarget).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้าง Target ใหม่ได้"})
			return
		}

		targetID = &newTarget.ID
	}

	if targetID == nil || *targetID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบข้อมูลเกณฑ์มาตรฐาน หรือไม่ได้เลือก"})
		return
	}

	// หา Target เพื่อตรวจสอบ Status
	var target entity.Target
	if err := db.First(&target, *targetID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบ Target ที่เกี่ยวข้อง"})
		return
	}

	// ฟังก์ชันตรวจสอบ Status
	getStatusID := func(value float64) uint {
		var status entity.Status
		// ฟังก์ชันช่วยปัด 2 ตำแหน่ง
		round2 := func(f float64) float64 {
			return math.Round(f*100) / 100
		}
		value = round2(value)
		middle := round2(target.MiddleTarget)
		min := round2(target.MinTarget)
		max := round2(target.MaxTarget)

		if middle != 0 {
			if value >= middle {
				db.Where("status_name = ?", "ไม่ผ่านเกณฑ์มาตรฐาน").First(&status)
			} else {
				db.Where("status_name = ?", "ผ่านเกณฑ์มาตรฐาน").First(&status)
			}
		} else {
			if value >= min && value <= max {
				db.Where("status_name = ?", "ผ่านเกณฑ์มาตรฐาน").First(&status)
			} else {
				db.Where("status_name = ?", "ไม่ผ่านเกณฑ์มาตรฐาน").First(&status)
			}
		}
		return status.ID
	}

	// Update Garbage
	var garbage entity.Garbage
	if err := db.First(&garbage, input.ID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบข้อมูล Garbage"})
		return
	}

	garbage.Date = input.Date
	garbage.Quantity = input.Quantity
	garbage.AADC = input.AADC
	garbage.MonthlyGarbage = input.MonthlyGarbage
	garbage.AverageDailyGarbage = input.AverageDailyGarbage
	garbage.TotalSale = input.TotalSale
	garbage.Note = input.Note
	garbage.TargetID = targetID
	garbage.UnitID = input.UnitID
	garbage.EmployeeID = input.EmployeeID
	// คำนวณ StatusID
	statusID := getStatusID(input.AADC)
	garbage.StatusID = &statusID

	if err := db.Save(&garbage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดต Garbage"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "สำเร็จ", "garbage": garbage})
}

func GetInfectiousbyID(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var inf struct {
		ID                  uint      `json:"ID"`
		Date                time.Time `json:"Date"`
		Quantity            uint      `json:"Quantity"`
		AADC                float64   `json:"AADC"`
		MonthlyGarbage      float64   `json:"MonthlyGarbage"`
		AverageDailyGarbage float64   `json:"AverageDailyGarbage"`
		TotalSale           float64   `json:"TotalSale"`
		Note                string    `json:"Note"`
		TargetID            uint      `json:"TargetID"`
		UnitID              uint      `json:"UnitID"`
		UnitName            string    `json:"UnitName"` // ดึงจาก units
		EmployeeID          uint      `json:"EmployeeID"`
		MinTarget           float64   `json:"MinTarget"`
		MiddleTarget        float64   `json:"MiddleTarget"`
		MaxTarget           float64   `json:"MaxTarget"`
	}

	result := db.Table("garbages").
		Select(`garbages.id, garbages.date, garbages.quantity, garbages.aadc, garbages.monthly_garbage,
		        garbages.average_daily_garbage, garbages.total_sale, garbages.note, garbages.target_id,
		        garbages.unit_id, units.unit_name as unit_name, garbages.employee_id,
		        targets.min_target, targets.middle_target, targets.max_target`).
		Joins("INNER JOIN targets ON garbages.target_id = targets.id").
		Joins("INNER JOIN units ON garbages.unit_id = units.id").
		Where("garbages.id = ?", id).
		Scan(&inf)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
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

	// หา Parameter "ขยะติดเชื้อ"
	var param entity.Parameter
	if err := db.Where("parameter_name = ?", "ขยะติดเชื้อ").First(&param).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบ Parameter ขยะติดเชื้อ"})
		return
	}

	// หา record ก่อน
	var targetRecord entity.Garbage
	if err := db.First(&targetRecord, uint(uintID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลที่ต้องการลบ"})
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
		"message": "ลบข้อมูล Infectious สำเร็จ",
		"date":    dateKey,
	})
}

func GetLastDayInfectious(c *gin.Context) {
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
		Order("garbages.date desc").
		Scan(&firstinf)

	// จัดการกรณีที่เกิดข้อผิดพลาด
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	// ส่งข้อมูลกลับในรูปแบบ JSON
	c.JSON(http.StatusOK, firstinf)
}
