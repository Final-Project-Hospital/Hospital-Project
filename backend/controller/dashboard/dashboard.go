package dashboard

import (
	"net/http"
	"time"
	"strconv"
	//"string"

	"github.com/gin-gonic/gin"
	"github.com/Tawunchai/hospital-project/config"
	"github.com/Tawunchai/hospital-project/entity"
)

type EnvironmentalDataResponse struct {
	Date      time.Time `json:"date"`
	Value     float64   `json:"value"`
	Parameter string    `json:"parameter"`
	Unit      string    `json:"unit"`
	Treatment string    `json:"treatment"`
	Status    string    `json:"status"`
}
type EfficiencyResponse struct {
	Date        time.Time `json:"date"`
	Parameter   string    `json:"parameter"`
	Efficiency  float64   `json:"efficiency"` // ค่าที่คำนวณตามสูตรที่กำหนด
}

type AlertResponse struct {
	MonthYear string  `json:"month_year"`
	Parameter string  `json:"parameter"`
	Average   float64 `json:"average"`
	MaxValue  float64 `json:"max_value"`
	Unit      string  `json:"unit"`
}

func GetEnvironmentalDashboard(c *gin.Context) {
	db := config.DB()

	// Query params
	dateStr := c.Query("date")    // YYYY / YYYY-MM / YYYY-MM-DD ตาม type
	filterType := c.Query("type") // year | month | date
	viewType := c.Query("view")   // before | after | compare
	param := c.Query("param")     // ชื่อ parameter เช่น BOD, TDS

	var records []EnvironmentalDataResponse

	// เตรียม query พื้นฐาน
	query := db.Model(&entity.EnvironmentalRecord{}).
	Select(`environmental_records.id, environmental_records.date, environmental_records.data AS value, environmental_records.note,
		environmental_records.before_after_treatment_id, environmental_records.environment_id,
		environmental_records.parameter_id, environmental_records.standard_id, environmental_records.unit_id,
		environmental_records.employee_id,
		parameters.parameter_name AS parameter,
		units.unit_name AS unit,
		before_after_treatments.treatment_name AS treatment,
		statuses.status_name AS status,
		standards.min_value, standards.middle_value, standards.max_value`).
	Joins("INNER JOIN parameters ON environmental_records.parameter_id = parameters.id").
	Joins("INNER JOIN units ON environmental_records.unit_id = units.id").
	Joins("INNER JOIN standards ON environmental_records.standard_id = standards.id").
	Joins("INNER JOIN before_after_treatments ON environmental_records.before_after_treatment_id = before_after_treatments.id").
	Joins("INNER JOIN statuses ON environmental_records.status_id = statuses.id")


	// ---------------------------
	// กรองช่วงเวลา
	// ---------------------------
	// ถ้ามี date + type ให้กรองตามที่ระบุ (พฤติกรรมเดิม)
	// ถ้า "ไม่มีทั้ง date และ type" ให้ default = ย้อนหลัง 1 ปี (rolling 12 เดือนจาก "วันนี้")
	if dateStr != "" && filterType != "" {
		// แปลงรูปแบบตาม type
		var parsedDate time.Time
		var err error

		switch filterType {
		case "year":
			year, err := strconv.Atoi(dateStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid year format"})
				return
			}
			parsedDate = time.Date(year, 1, 1, 0, 0, 0, 0, time.Local)
			// ทั้งปีนั้น
			start := parsedDate
			end := parsedDate.AddDate(1, 0, 0)
			query = query.Where("environmental_records.date >= ? AND environmental_records.date < ?", start, end)

		case "month":
			parsedDate, err = time.ParseInLocation("2006-01", dateStr, time.Local)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid month format. Expected YYYY-MM"})
				return
			}
			// ทั้งเดือนนั้น
			start := time.Date(parsedDate.Year(), parsedDate.Month(), 1, 0, 0, 0, 0, time.Local)
			end := start.AddDate(0, 1, 0)
			query = query.Where("environmental_records.date >= ? AND environmental_records.date < ?", start, end)

		case "date":
			parsedDate, err = time.ParseInLocation("2006-01-02", dateStr, time.Local)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Expected YYYY-MM-DD"})
				return
			}
			// เฉพาะวันนั้น (00:00 - 23:59:59)
			start := time.Date(parsedDate.Year(), parsedDate.Month(), parsedDate.Day(), 0, 0, 0, 0, time.Local)
			end := start.AddDate(0, 0, 1)
			query = query.Where("environmental_records.date >= ? AND environmental_records.date < ?", start, end)

		default:
			// ถ้า type ไม่ตรง format ที่รองรับ ให้แจ้ง bad request
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid type. Expected year|month|date"})
			return
		}
	} else {
		// ✅ DEFAULT: ย้อนหลัง 1 ปี (rolling window) นับจาก "ตอนนี้" ใน time.Local
		now := time.Now().In(time.Local)
		start := now.AddDate(-1, 0, 0)
		// เลือกใช้ช่วง [start, now] เพื่อให้ใช้ index ได้ดี และครอบคลุมทั้ง rolling 12 เดือน
		query = query.Where("environmental_records.date >= ? AND environmental_records.date <= ?", start, now)
	}

	// ---------------------------
	// กรอง parameter (ถ้ามี)
	// ---------------------------
	if param != "" {
		query = query.Where("parameters.parameter_name = ?", param)
	}

	// ---------------------------
	// กรอง viewType
	// ---------------------------
	switch viewType {
	case "before":
		query = query.Where("before_after_treatments.id = ?", 1)
	case "after":
		query = query.Where("before_after_treatments.id = ?", 2)
	default:
		// "compare" หรือค่าอื่น ๆ ให้เป็นก่อน+หลัง
		query = query.Where("before_after_treatments.id IN (?)", []int{1, 2})
	}

	// เรียงวันเก่า -> ใหม่
	if err := query.Order("environmental_records.date ASC").Scan(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, records)
}
func GetEnvironmentalEfficiency(c *gin.Context) {
	db := config.DB()

	dateStr := c.Query("date")    // YYYY / YYYY-MM / YYYY-MM-DD
	filterType := c.Query("type") // year | month | date
	param := c.Query("param")     // optional: ระบุ parameter เฉพาะ

	// 1) สร้างช่วงเวลา (default: rolling 1 ปี ถ้าไม่ส่ง date/type)
	var start, end time.Time
	now := time.Now().In(time.Local)

	if dateStr != "" && filterType != "" {
		switch filterType {
		case "year":
			year, err := strconv.Atoi(dateStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid year format"})
				return
			}
			start = time.Date(year, 1, 1, 0, 0, 0, 0, time.Local)
			end = start.AddDate(1, 0, 0)

		case "month":
			t, err := time.ParseInLocation("2006-01", dateStr, time.Local)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid month format. Expected YYYY-MM"})
				return
			}
			start = time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, time.Local)
			end = start.AddDate(0, 1, 0)

		case "date":
			t, err := time.ParseInLocation("2006-01-02", dateStr, time.Local)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Expected YYYY-MM-DD"})
				return
			}
			start = time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.Local)
			end = start.AddDate(0, 0, 1)

		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid type. Expected year|month|date"})
			return
		}
	} else {
		// default: ย้อนหลัง 1 ปี
		end = now
		start = now.AddDate(-1, 0, 0)
	}

	// 2) ดึงข้อมูลก่อน/หลังในช่วงเวลาเดียวกัน
	//    สมมุติ mapping: before_after_treatments.id: 1=ก่อน, 2=หลัง
	type rec struct {
		Date      time.Time
		Parameter string
		Value     float64
		TreatID   int
	}
	var rows []rec

	q := db.Model(&entity.EnvironmentalRecord{}).
		Select("environmental_records.date AS date, parameters.parameter_name AS parameter, environmental_records.data AS value, before_after_treatments.id AS treat_id").
		Joins("INNER JOIN parameters ON environmental_records.parameter_id = parameters.id").
		Joins("INNER JOIN before_after_treatments ON environmental_records.before_after_treatment_id = before_after_treatments.id").
		Where("environmental_records.date >= ? AND environmental_records.date < ?", start, end)

	if param != "" {
		q = q.Where("parameters.parameter_name = ?", param)
	}

	if err := q.Order("environmental_records.date ASC").Scan(&rows).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 3) จับคู่ ก่อน/หลัง ตาม (วันที่เดียวกัน, parameter เดียวกัน)
	//    ถ้าในวันเดียวกันมีหลาย record ต่อพารามิเตอร์/สถานะ ควร normalize ที่ schema หรือ group ก่อน
	type key struct {
		Day       string // ใช้ day string เพื่อเทียบแบบวัน/เดือน/ปีได้ง่ายขึ้นตาม filterType (แต่เราดึงเป็นช่วงอยู่แล้ว)
		Parameter string
	}
	// เก็บค่าก่อน/หลัง
	type pair struct {
		Before *float64
		After  *float64
		Date   time.Time // เก็บจริงเพื่อส่งคืน
	}

	m := make(map[key]*pair)
	for _, r := range rows {
		// normalize key เป็น "day" แม้เราจะดึงเป็นช่วง (ให้กราฟต่อวันสอดคล้อง)
		dayKey := r.Date.Format("2006-01-02")
		k := key{Day: dayKey, Parameter: r.Parameter}
		p, ok := m[k]
		if !ok {
			p = &pair{Date: r.Date}
			m[k] = p
		}
		if r.TreatID == 1 {
			v := r.Value
			p.Before = &v
		} else if r.TreatID == 2 {
			v := r.Value
			p.After = &v
		}
	}

	// 4) คำนวณประสิทธิภาพตามสูตร: (ก่อน - หลัง) / (ก่อน * 100)
	//    ถ้าไม่มีค่าก่อน หรือ ก่อน == 0  -> ข้าม (เลี่ยงหารศูนย์)
	resp := make([]EfficiencyResponse, 0, len(m))
	for k, p := range m {
		if p.Before == nil || p.After == nil {
			continue
		}
		if *p.Before == 0 {
			continue
		}
		eff := (*p.Before - *p.After) / (*p.Before * 100.0) // ตามสูตรที่ผู้ใช้ระบุ
		resp = append(resp, EfficiencyResponse{
			Date:       p.Date,
			Parameter:  k.Parameter,
			Efficiency: eff,
		})
	}

	c.JSON(http.StatusOK, resp)
}
func GetEnvironmentalAlerts(c *gin.Context) {
	db := config.DB()

	dateStr := c.Query("date")
	filterType := c.Query("type")
	param := c.Query("param")

	var start, end time.Time
	now := time.Now().In(time.Local)

	if dateStr != "" && filterType != "" {
		switch filterType {
		case "year":
			year, err := strconv.Atoi(dateStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid year format"})
				return
			}
			start = time.Date(year, 1, 1, 0, 0, 0, 0, time.Local)
			end = start.AddDate(1, 0, 0)
		case "month":
			t, err := time.ParseInLocation("2006-01", dateStr, time.Local)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid month format"})
				return
			}
			start = time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, time.Local)
			end = start.AddDate(0, 1, 0)
		case "date":
			t, err := time.ParseInLocation("2006-01-02", dateStr, time.Local)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
				return
			}
			start = time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.Local)
			end = start.AddDate(0, 0, 1)
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid type. Expected year|month|date"})
			return
		}
	} else {
		end = now
		start = now.AddDate(-1, 0, 0)
	}

	var alerts []AlertResponse

	// Query ค่าเฉลี่ยแยกตามเดือน, parameter, unit, max_value
	// ใช้ GORM + raw SQL ฟังก์ชัน DATE_FORMAT ของ MySQL
	// ถ้า DB เป็นอื่น ต้องแก้ฟังก์ชันแปลงวันที่ให้เหมาะสม
	tx := db.Table("environmental_records").
		Select("DATE_FORMAT(environmental_records.date, '%Y-%m') AS month_year, parameters.parameter_name AS parameter, units.unit_name AS unit, AVG(environmental_records.data) AS average, standards.max_value").
		Joins("INNER JOIN parameters ON environmental_records.parameter_id = parameters.id").
		Joins("INNER JOIN standards ON environmental_records.standard_id = standards.id").
		Joins("INNER JOIN units ON environmental_records.unit_id = units.id").
		Where("environmental_records.date >= ? AND environmental_records.date < ?", start, end).
		Group("month_year, parameter, max_value, unit").
		Having("AVG(environmental_records.data) > standards.max_value || AVG(environmental_records.data) < standards.min_value || AVG(environmental_records.data) > standards.middle_value")

	if param != "" {
		tx = tx.Where("parameters.parameter_name = ?", param)
	}

	if err := tx.Scan(&alerts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, alerts)
}